import express from "express";
import { testWebSocket } from "../controllers/ChatController";

const router = express.Router();

router.post("/test", testWebSocket);

export default router;
