import { Type, FunctionDeclaration, Schema } from "@google/genai";
import { ToolDefinition, ToolParam } from "./types";

export function createToolRegistry(tools: ToolDefinition[]): Map<string, ToolDefinition> {
  const registry = new Map<string, ToolDefinition>();
  for (const tool of tools) {
    registry.set(tool.name, tool);
  }
  return registry;
}

function paramToSchemaType(param: ToolParam): Type {
  switch (param.type) {
    case "number": return Type.NUMBER;
    case "string": return Type.STRING;
    case "boolean": return Type.BOOLEAN;
    default: return Type.STRING;
  }
}

function paramToSchema(param: ToolParam): Schema {
  const schema: Schema = {
    type: paramToSchemaType(param),
    description: param.description,
  };
  if (param.enum) schema.enum = param.enum;
  return schema;
}

export function toGeminiFunctionDeclarations(
  registry: Map<string, ToolDefinition>
): FunctionDeclaration[] {
  const declarations: FunctionDeclaration[] = [];

  for (const tool of registry.values()) {
    const properties: Record<string, Schema> = {};
    const required: string[] = [];

    for (const [paramName, param] of Object.entries(tool.parameters)) {
      properties[paramName] = paramToSchema(param);
      if (param.required) required.push(paramName);
    }

    declarations.push({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: Type.OBJECT,
        properties,
        required,
      },
    });
  }

  return declarations;
}
