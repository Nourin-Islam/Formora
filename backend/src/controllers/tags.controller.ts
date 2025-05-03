import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { refreshEvents } from "../lib/refresh";
import { cache } from "../lib/cache";

export const getAllTags = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || "name";
    const sortOrder = (req.query.sortOrder as string) || "asc";
    const nameFilter = (req.query.name as string) || undefined;

    const cacheKey = `tags:${page}:${limit}:${sortBy}:${sortOrder}:${nameFilter}`;
    const cachedTags = await cache.get(cacheKey);

    if (cachedTags) {
      const parsedTags = typeof cachedTags === "string" ? JSON.parse(cachedTags) : cachedTags;
      const totalCount = await prisma.tag.count({
        where: nameFilter ? { name: { contains: nameFilter, mode: "insensitive" } } : undefined,
      });

      return res.json({
        tags: parsedTags,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        cached: true,
      });
    }

    // Fetch from DB if not in cache
    const tags = await prisma.tag.findMany({
      where: nameFilter ? { name: { contains: nameFilter, mode: "insensitive" } } : undefined,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.tag.count({
      where: nameFilter ? { name: { contains: nameFilter, mode: "insensitive" } } : undefined,
    });

    // Set cache
    cache.set(cacheKey, JSON.stringify(tags), 5 * 60); // 5 min TTL

    res.json({
      tags,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tags" });
  }
};

export const searchTags = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query) return res.json([]);

    const tags = await prisma.tag.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      take: limit,
    });

    res.json(tags);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json([]);
  }
};

export const createTag = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    const existingTag = await prisma.tag.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (existingTag) return res.json(existingTag);

    const tag = await prisma.tag.create({
      data: { name: name.toLowerCase() },
    });

    res.status(201).json(tag);
    // console.log("Tag created:", tag);
    refreshEvents.emit("refreshView");
  } catch (err) {
    res.status(500).json({ message: "Failed to create tag" });
  }
};

export const updateTag = async (req: Request, res: Response) => {
  try {
    const tagId = parseInt(req.params.id);
    const { name } = req.body;

    const updated = await prisma.tag.update({
      where: { id: tagId },
      data: { name: name.toLowerCase() },
    });

    res.json(updated);
    refreshEvents.emit("refreshView");
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ message: "Tag not found" });
    } else {
      res.status(500).json({ message: "Failed to update tag" });
    }
  }
};

export const deleteTag = async (req: Request, res: Response) => {
  try {
    const tagId = parseInt(req.params.id);

    await prisma.tag.delete({ where: { id: tagId } });

    res.json({ message: "Tag deleted successfully" });
    refreshEvents.emit("refreshView");
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ message: "Tag not found" });
    } else {
      res.status(500).json({ message: "Failed to delete tag" });
    }
  }
};

/*
export const getTagById = async (req: Request, res: Response) => {
  try {
    const tagId = parseInt(req.params.id);
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });

    if (!tag) return res.status(404).json({ message: "Tag not found" });

    res.json(tag);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tag" });
  }
};

*/
