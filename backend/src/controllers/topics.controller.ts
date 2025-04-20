// controllers/topics.controller.ts
import { prisma } from "../lib/prisma.ts";
import { Request, Response } from "express";
import { refreshEvents } from "../lib/refresh.ts";

export const getAllTopics = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const sortBy = (req.query.sortBy as string) || "name";
    const sortOrder = (req.query.sortOrder as string) || "asc";
    const nameFilter = (req.query.name as string) || undefined;

    const topics = await prisma.topic.findMany({
      where: nameFilter ? { name: { contains: nameFilter, mode: "insensitive" } } : undefined,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.topic.count({
      where: nameFilter ? { name: { contains: nameFilter } } : undefined,
    });

    res.json({
      topics,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch topics" });
  }
};

export const searchTopics = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const topics = await prisma.topic.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: limit,
    });

    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: "Failed to search topics" });
  }
};

export const getTopicById = async (req: Request, res: Response) => {
  try {
    const topicId = parseInt(req.params.id);

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch topic" });
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
    res.status(500).json({ error: "Failed to create topic" });
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
      res.status(404).json({ error: "Topic not found" });
      return;
    }
    res.status(500).json({ error: "Failed to update topic" });
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
      res.status(404).json({ error: "Topic not found" });
      return;
    }
    res.status(500).json({ error: "Failed to delete topic" });
  }
};
