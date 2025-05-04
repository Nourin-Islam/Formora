// controllers/topics.controller
import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import { refreshEvents } from "../lib/refresh";
import { cache } from "../lib/cache";

export const getAllTopics = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const sortBy = (req.query.sortBy as string) || "name";
    const sortOrder = (req.query.sortOrder as string) || "asc";
    const nameFilter = (req.query.name as string) || undefined;

    const cacheKey = `topics:${page}:${limit}:${sortBy}:${sortOrder}:${nameFilter}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log("Cache hit for topics:", cacheKey);
      return res.json(cached);
    }

    const topics = await prisma.topic.findMany({
      where: nameFilter ? { name: { contains: nameFilter, mode: "insensitive" } } : undefined,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.topic.count({
      where: nameFilter ? { name: { contains: nameFilter } } : undefined,
    });

    cache.set(
      cacheKey,
      {
        topics,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
      },
      60 * 60
    ); // Cache for 1 hour
    res.json({
      topics,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch topics" });
  }
};

export const createTopic = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    const topic = await prisma.topic.create({
      data: { name },
    });

    res.status(201).json(topic);
    refreshEvents.emit("refreshView");
  } catch (err) {
    res.status(500).json({ message: "Failed to create topic" });
  }
};

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const topicId = parseInt(req.params.id);
    const { name } = req.body;

    const updated = await prisma.topic.update({
      where: { id: topicId },
      data: { name },
    });

    res.json(updated);
    refreshEvents.emit("refreshView");
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ message: "Topic not found" });
      return;
    }
    res.status(500).json({ message: "Failed to update topic" });
  }
};

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const topicId = parseInt(req.params.id);

    await prisma.topic.delete({
      where: { id: topicId },
    });

    res.json({ message: "Topic deleted successfully" });
    refreshEvents.emit("refreshView");
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ message: "Topic not found" });
      return;
    }
    res.status(500).json({ message: "Failed to delete topic" });
  }
};
