import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

export const getAllTags = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || "name";
    const sortOrder = (req.query.sortOrder as string) || "asc";
    const nameFilter = (req.query.name as string) || undefined;

    const tags = await prisma.tag.findMany({
      where: nameFilter ? { name: { contains: nameFilter, mode: "insensitive" } } : undefined,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.tag.count({
      where: nameFilter ? { name: { contains: nameFilter, mode: "insensitive" } } : undefined,
    });

    res.json({
      tags,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tags" });
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

export const getTagById = async (req: Request, res: Response) => {
  try {
    const tagId = parseInt(req.params.id);
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });

    if (!tag) return res.status(404).json({ error: "Tag not found" });

    res.json(tag);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tag" });
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
  } catch (err) {
    res.status(500).json({ error: "Failed to create tag" });
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
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ error: "Tag not found" });
    } else {
      res.status(500).json({ error: "Failed to update tag" });
    }
  }
};

export const deleteTag = async (req: Request, res: Response) => {
  try {
    const tagId = parseInt(req.params.id);

    await prisma.tag.delete({ where: { id: tagId } });

    res.json({ message: "Tag deleted successfully" });
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ error: "Tag not found" });
    } else {
      res.status(500).json({ error: "Failed to delete tag" });
    }
  }
};
