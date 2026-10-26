import type { ValidateFunction } from "ajv";
import * as compiled from "./generated/validators.js";
import { matchToolDefinitions } from "../mcp/toolDefinitions.ts";
import type { MatchToolName } from "../mcp/matchTools.ts";

export const { validateMatchShape, validateSceneShape, validateEventShape, validateInsightShape, validateMomentContextShape, validateOrchestrationTraceShape } = compiled;
export const toolValidators = new Map<MatchToolName, ValidateFunction>(matchToolDefinitions.map(({ name }) => [name, compiled[name]]));
