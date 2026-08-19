export function createToolCatalog({
  CANVASIGHT_FRAMEWORK_QUESTIONS_URI,
  CANVASIGHT_WIDGET_URI,
  canvasightGraphContextOutputSchema,
  canvasightRunOutputSchema,
  frameworkQuestionsOutputSchema,
  generatedImagesOutputSchema,
  looseObjectOutputSchema,
  openCanvasightBrowserFallbackOutputSchema,
  openCanvasightWidgetOutputSchema
}) {
  return [
    {
      name: "ask_canvasight_framework_questions",
      description:
        "Ask 1-3 consequential framework questions in a compact inline Canvasight form when the answers would materially change content mode, framework dimensions, scope, key relationships, write behavior, or required coverage. Inspect repository, current Page, user context, and relevant Skills first. Stop graph writing after calling this tool and wait for the user's submitted answers.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title for the confirmation card." },
          description: { type: "string", description: "Optional concise explanation of why confirmation is needed." },
          language: { type: "string", enum: ["zh", "en"], description: "Component language. Defaults to zh." },
          questions: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Stable question id." },
                question: { type: "string", description: "Question text." },
                selectionMode: { type: "string", enum: ["single", "multiple"] },
                customAnswerLabel: { type: "string", description: "Optional label for the custom answer field." },
                options: {
                  type: "array",
                  minItems: 2,
                  maxItems: 3,
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", description: "Stable option id within this question." },
                      label: { type: "string" },
                      description: { type: "string" },
                      recommended: { type: "boolean" }
                    },
                    required: ["id", "label"],
                    additionalProperties: false
                  }
                }
              },
              required: ["id", "question", "selectionMode", "options"],
              additionalProperties: false
            }
          }
        },
        required: ["title", "questions"],
        additionalProperties: false
      },
      outputSchema: frameworkQuestionsOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      _meta: {
        ui: {
          resourceUri: CANVASIGHT_FRAMEWORK_QUESTIONS_URI,
          visibility: ["model", "app"],
          displayMode: "inline"
        },
        "openai/toolInvocation/invoking": "Preparing framework questions...",
        "openai/toolInvocation/invoked": "Framework questions ready"
      }
    },
    {
      name: "render_canvasight_canvas_widget",
      description:
        "Open Canvasight as a native Codex widget for the active project. Pass the active task's CODEX_THREAD_ID as threadId so Chat Run targets the same thread. Prefer this over localhost browser URLs for normal use because the widget has the Codex host bridge and Run buttons can send follow-up messages to the current thread.",
      inputSchema: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "Optional local project path to associate with the widget session."
          },
          language: {
            type: "string",
            enum: ["zh", "en"],
            description: "Optional UI and markdown language preference."
          },
          threadId: {
            type: "string",
            description: "Current Codex thread id. Read CODEX_THREAD_ID in the active task and pass it so native mode preflight targets the same thread."
          }
        },
        required: ["threadId"],
        additionalProperties: false
      },
      outputSchema: openCanvasightWidgetOutputSchema,
      _meta: {
        ui: {
          resourceUri: CANVASIGHT_WIDGET_URI,
          visibility: ["model", "app"]
        },
        "openai/toolInvocation/invoking": "Opening Canvasight widget...",
        "openai/toolInvocation/invoked": "Canvasight widget session created"
      }
    },
    {
      name: "open_canvasight",
      description:
        "Open Canvasight as the default native Codex widget for the active project. Pass the active task's CODEX_THREAD_ID as threadId so Chat Run targets the same thread. This is the normal path: the widget has the Codex host bridge, so Run buttons can send follow-up messages to the current thread.",
      inputSchema: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "Optional local project path to associate with the session."
          },
          language: {
            type: "string",
            enum: ["zh", "en"],
            description: "Optional UI and markdown language preference."
          },
          threadId: {
            type: "string",
            description: "Current Codex thread id. Read CODEX_THREAD_ID in the active task and pass it for native Chat Run."
          }
        },
        required: ["threadId"],
        additionalProperties: false
      },
      outputSchema: openCanvasightWidgetOutputSchema,
      _meta: {
        ui: {
          resourceUri: CANVASIGHT_WIDGET_URI,
          visibility: ["model", "app"]
        },
        "openai/toolInvocation/invoking": "Opening Canvasight widget...",
        "openai/toolInvocation/invoked": "Canvasight widget session created"
      }
    },
    {
      name: "open_canvasight_browser_fallback",
      description:
        "Open a Canvasight browser fallback URL in Codex's in-app browser/sidebar. Use only for debugging or when native widget rendering is unavailable; browser fallback pages queue Run payloads for await_canvasight_run instead of direct widget delivery.",
      inputSchema: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "Optional local project path to associate with the browser fallback session."
          },
          language: {
            type: "string",
            enum: ["zh", "en"],
            description: "Optional UI and markdown language preference."
          },
          threadId: {
            type: "string",
            description: "Optional Codex thread id for fallback queue filtering. Defaults to CODEX_THREAD_ID when available."
          }
        },
        additionalProperties: false
      },
      outputSchema: openCanvasightBrowserFallbackOutputSchema
    },
    {
      name: "list_canvasight_recent_projects",
      description: "List Canvasight projects remembered across Codex threads.",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            minimum: 1,
            maximum: 50,
            description: "Maximum number of recent projects to return."
          }
        },
        additionalProperties: false
      },
      outputSchema: looseObjectOutputSchema
    },
    {
      name: "open_canvasight_recent_project",
      description:
        "Open the most recent remembered Canvasight project, or a chosen recent project path/index, as the default native Codex widget. Pass the active task's CODEX_THREAD_ID as threadId so Chat Run targets the same thread. The opened project becomes active Canvasight context for later graph-first handling of medium or complex requests.",
      inputSchema: {
        type: "object",
        properties: {
          index: {
            type: "number",
            minimum: 1,
            description: "1-based recent project index. Defaults to the most recent project."
          },
          projectPath: {
            type: "string",
            description: "Optional explicit project path. When provided, it is opened and remembered."
          },
          language: {
            type: "string",
            enum: ["zh", "en"],
            description: "Optional UI and markdown language preference."
          },
          threadId: {
            type: "string",
            description: "Current Codex thread id. Read CODEX_THREAD_ID in the active task and pass it for native Chat Run."
          }
        },
        required: ["threadId"],
        additionalProperties: false
      },
      outputSchema: openCanvasightWidgetOutputSchema,
      _meta: {
        ui: {
          resourceUri: CANVASIGHT_WIDGET_URI,
          visibility: ["model", "app"]
        },
        "openai/toolInvocation/invoking": "Opening Canvasight widget...",
        "openai/toolInvocation/invoked": "Canvasight widget session created"
      }
    },
    {
      name: "claim_canvasight_thread",
      description:
        "Claim an already-open Canvasight project or session for the current Codex thread without opening a new browser tab. Use this from a new thread when a Canvasight browser/daemon is already running and future Run clicks should go to this current thread.",
      inputSchema: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "Optional project path to claim. Defaults to the most recent Canvasight project when sessionId is omitted."
          },
          sessionId: {
            type: "string",
            description: "Optional existing Canvasight session id to claim. When omitted, Canvasight claims active sessions for the project."
          },
          language: {
            type: "string",
            enum: ["zh", "en"],
            description: "Optional UI and markdown language preference for a session created during claim."
          },
          threadId: {
            type: "string",
            description: "Optional current Codex thread id. Defaults to CODEX_THREAD_ID when available."
          }
        },
        additionalProperties: false
      },
      outputSchema: looseObjectOutputSchema
    },
    {
      name: "list_canvasight_node_templates",
      description: "List lightweight summaries of saved global Canvasight node templates so AI graph generation can choose reusable prompts without loading full template bodies.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Optional search text matched against template title and body."
          },
          limit: {
            type: "number",
            minimum: 1,
            maximum: 200,
            description: "Maximum number of templates to return. Defaults to 20."
          }
        },
        additionalProperties: false
      },
      outputSchema: looseObjectOutputSchema
    },
    {
      name: "list_canvasight_skills",
      description:
        "List lightweight summaries of enabled Codex Skills resolved for the current project. Query by a canvas or node responsibility before choosing professional content Skills or assigning an AI-selected node Skill. Results never include Skill bodies or local paths.",
      inputSchema: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "Optional project cwd used by Codex Skill resolution. Defaults to the current Canvasight project."
          },
          threadId: {
            type: "string",
            description: "Optional current Codex thread id used to resolve its project cwd."
          },
          query: {
            type: "string",
            description: "Optional canvas or node responsibility matched against Skill name, display name, description, and scope."
          },
          forceReload: {
            type: "boolean",
            description: "Ask Codex to refresh its resolved Skill catalog before searching."
          },
          limit: {
            type: "number",
            minimum: 1,
            maximum: 200,
            description: "Maximum Skill summaries to return. Defaults to 50."
          }
        },
        additionalProperties: false
      },
      outputSchema: looseObjectOutputSchema
    },
    {
      name: "get_canvasight_node_template",
      description: "Read one saved global Canvasight node template by id, including full prompt body and attachment metadata, after list_canvasight_node_templates identifies a useful match.",
      inputSchema: {
        type: "object",
        properties: {
          templateId: {
            type: "string",
            description: "Template id returned by list_canvasight_node_templates."
          }
        },
        required: ["templateId"],
        additionalProperties: false
      },
      outputSchema: looseObjectOutputSchema
    },
    {
      name: "get_canvasight_graph_context",
      description:
        "Read the active Canvasight page and current document revision before deciding whether to append, replace, or incrementally edit the graph. Task summaries include lightweight legacyAttachments handles without absolute paths or file URLs; use those handles only with context-bound promote-attachment. Use the returned ids and revision for merge-active-page operations.",
      inputSchema: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "Optional local project path. Defaults to the current Canvasight project."
          },
          threadId: {
            type: "string",
            description: "Optional current Codex thread id used to resolve its project."
          }
        },
        additionalProperties: false
      },
      outputSchema: canvasightGraphContextOutputSchema
    },
    {
      name: "write_canvasight_graph",
      description:
        "Write Pages, Markdown Task Nodes, managed Asset Nodes, single-level Groups, membership, and semantic Edges into a project's .scatter/scatter.json so Codex or another AI can create an editable Canvasight graph. New inline Task attachments are forbidden. Image, SVG, video, and ordinary files share one Asset shape whose presentation is inferred from a server-validated managed file. Group membership uses parentId rather than Edges; legacy attachment promotion is a context-bound Task-to-Asset operation. Prefer this when Canvasight is active and a later user request is medium, complex, multi-step, architectural, product-planning, article-mapping, or otherwise benefits from decomposition before direct execution. Saved global Task templates may be reused through templateId or templateQuery; legacy template attachments are copied into project Assets instead of restored inline.",
      inputSchema: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "Local project path. Defaults to Canvasight's default project path when omitted."
          },
          projectName: {
            type: "string",
            description: "Optional project name stored in .scatter/scatter.json."
          },
          mode: {
            type: "string",
            enum: ["append-page", "merge-active-page", "replace-active-page", "replace-document"],
            description: "Write behavior. Use merge-active-page with expectedRevision and operations to preserve and edit the active page."
          },
          expectedRevision: {
            type: "integer",
            description: "Exact revision returned with contextId. Legacy calls without contextId remain strict stale-write checked."
          },
          contextId: {
            type: "string",
            description: "Context id returned by get_canvasight_graph_context. Binds merge-active-page to that Page and enables safe automatic rebase."
          },
          clientMutationId: {
            type: "string",
            description: "Stable unique id for this exact context-bound graph mutation. Reuse it only when retrying the same payload."
          },
          graphType: {
            type: "string",
            enum: ["software-product", "article-outline", "codebase-structure", "task-plan", "general"],
            description:
              "Task generation strategy metadata. It affects how AI should organize nodes and default layout, but does not decide page creation or replacement."
          },
          pageId: {
            type: "string",
            description: "Optional id for the single page form."
          },
          pageName: {
            type: "string",
            description: "Optional name for the single page form."
          },
          activePageId: {
            type: "string",
            description: "Active page id when mode is replace-document."
          },
          layout: {
            type: "string",
            enum: ["horizontal"],
            description: "Horizontal dependency layout for AI writes. Legacy vertical and grid requests are accepted at runtime, normalized to horizontal, and reported as deprecated advisories."
          },
          layoutPolicy: {
            type: "string",
            enum: ["auto", "preserve-explicit"],
            description: "Coordinate policy for AI writes. auto is the default and recomputes the whole graph from topology; preserve-explicit keeps caller-provided axes for compatibility."
          },
          viewport: {
            type: "object",
            description: "Optional viewport for generated pages.",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              zoom: { type: "number" }
            },
            additionalProperties: true
          },
          reuseTemplates: {
            type: "boolean",
            description: "Whether to allow saved global node templates to be reused. Defaults to true."
          },
          operations: {
            type: "array",
            description: "Explicit incremental operations for merge-active-page: add/update/remove-node, add/update/remove-edge, context-bound promote-attachment, and relayout-page.",
            items: {
              type: "object",
              properties: {
                op: {
                  type: "string",
                  enum: ["add-node", "update-node", "remove-node", "add-edge", "update-edge", "remove-edge", "promote-attachment", "relayout-page"]
                },
                node: { type: "object", additionalProperties: true },
                nodeId: { type: "string" },
                attachmentId: { type: "string" },
                assetNodeId: { type: "string" },
                edge: { type: "object", additionalProperties: true },
                edgeId: { type: "string" },
                edgeLabel: { type: "string" },
                changes: { type: "object", additionalProperties: true }
              },
              required: ["op"],
              additionalProperties: false
            }
          },
          frameworkManifest: {
            type: "object",
            description: "Non-persisted framework, professional content Skill selection, node Skill assignment, and final-page coverage used for closed-loop validation before Canvasight performs the only graph write.",
            properties: {
              intent: { type: "string", enum: ["create", "analyze", "organize", "refine", "decide", "execute"] },
              primaryDomain: { type: "string", enum: ["software-product", "ux-design", "codebase", "article", "research", "task-execution"] },
              secondaryDomains: {
                type: "array",
                items: { type: "string", enum: ["software-product", "ux-design", "codebase", "article", "research", "task-execution"] }
              },
              maturity: { type: "string", enum: ["explore", "define", "decide", "deliver"] },
              output: { type: "string", enum: ["exploration-map", "structured-outline", "system-map", "decision-map", "execution-plan"] },
              contentMode: {
                type: "string",
                enum: ["canvasight-default", "skill-led"],
                description: "Defaults to canvasight-default. skill-led lets one primary professional Skill own content coverage while Canvasight keeps graph validation and horizontal layout."
              },
              contentSkills: {
                type: "array",
                description: "Professional content Skills for the whole canvas. skill-led requires exactly one primary Skill; compatible supporting Skills use augment.",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    role: { type: "string", enum: ["primary", "augment"] }
                  },
                  required: ["name", "role"],
                  additionalProperties: false
                }
              },
              skillAssignments: {
                type: "object",
                description: "Non-persisted mapping from final node id to visible $skill-name assignments already present in that node body.",
                additionalProperties: {
                  type: "array",
                  minItems: 1,
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      source: { type: "string", enum: ["user-explicit", "ai-selected"] },
                      rationale: { type: "string" }
                    },
                    required: ["name", "source"],
                    additionalProperties: false
                  }
                }
              },
              coverage: {
                type: "object",
                additionalProperties: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 1
                }
              },
              semanticStructure: {
                type: "object",
                description: "Non-persisted semantic cohesion review keyed by final node id. Use meaning and responsibility, never counts or text length, to decide decomposition.",
                additionalProperties: {
                  type: "object",
                  properties: {
                    responsibility: { type: "string" },
                    inseparableReason: { type: "string" }
                  },
                  required: ["responsibility", "inseparableReason"],
                  additionalProperties: false
                }
              },
              semanticRelationships: {
                type: "object",
                description: "Semantic review keyed by final edge id for relationships between covered responsibilities.",
                additionalProperties: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["dependency", "sequence", "containment", "evidence", "decision", "navigation", "flow"] },
                    rationale: { type: "string" }
                  },
                  required: ["type", "rationale"],
                  additionalProperties: false
                }
              }
            },
            required: ["intent", "primaryDomain", "maturity", "output", "coverage", "semanticStructure", "semanticRelationships"],
            additionalProperties: false
          },
          nodes: {
            type: "array",
            description:
              "Single page node list. type may be task, asset, or group. Task nodes accept title, Markdown body, runMode, effort, templateId, and templateQuery; new inline Task attachments are forbidden. Asset nodes accept title, description, and one managed project asset; media presentation is inferred from the managed file, while role is deprecated legacy compatibility. Task and Asset nodes may use parentId for one-level Group membership. Group nodes accept title, description, width, and height; Groups cannot nest.",
            items: { type: "object", additionalProperties: true }
          },
          edges: {
            type: "array",
            description: "Single page semantic edge list. source and target must reference Task or Asset node ids; Group membership uses parentId, not edges.",
            items: { type: "object", additionalProperties: true }
          },
          pages: {
            type: "array",
            description: "Optional multi-page graph input. When provided, top-level nodes/edges are ignored.",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                layout: { type: "string", enum: ["horizontal"] },
                viewport: { type: "object", additionalProperties: true },
                nodes: { type: "array", items: { type: "object", additionalProperties: true } },
                edges: { type: "array", items: { type: "object", additionalProperties: true } }
              },
              additionalProperties: true
            }
          }
        },
        additionalProperties: false
      },
      outputSchema: looseObjectOutputSchema
    },
    {
      name: "add_canvasight_generated_images",
      description:
        "Import final PNG, JPEG, or WebP files produced by Codex imagegen into the current project's managed .scatter/assets directory and atomically add one ungrouped Asset Node per image to the right side of the Page captured by get_canvasight_graph_context. This tool does not generate images. Call it only after verified native Canvasight readiness and successful imagegen inspection, using the captured contextId, revision, exact current threadId, and one stable clientMutationId.",
      inputSchema: {
        type: "object",
        properties: {
          threadId: {
            type: "string",
            description: "Exact current Codex task id. Read CODEX_THREAD_ID and pass it explicitly."
          },
          projectPath: {
            type: "string",
            description: "Exact project path returned by get_canvasight_graph_context."
          },
          contextId: {
            type: "string",
            description: "Context id captured before image generation; it permanently binds this import to that Page."
          },
          expectedRevision: {
            type: "integer",
            description: "Exact documentRevision returned with contextId."
          },
          clientMutationId: {
            type: "string",
            description: "Stable unique id for this exact image batch. Reuse only when retrying the same payload."
          },
          language: {
            type: "string",
            enum: ["zh", "en"],
            description: "Language for a recovery-copy label when the captured Page was deleted."
          },
          images: {
            type: "array",
            minItems: 1,
            maxItems: 16,
            description: "Final inspected image files in their desired top-to-bottom canvas order.",
            items: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Absolute path under the current project or CODEX_HOME/generated_images."
                },
                title: {
                  type: "string",
                  description: "Optional Asset Node title. Defaults to the generated file name."
                }
              },
              required: ["path"],
              additionalProperties: false
            }
          }
        },
        required: ["threadId", "contextId", "expectedRevision", "clientMutationId", "images"],
        additionalProperties: false
      },
      outputSchema: generatedImagesOutputSchema
    },
    {
      name: "record_project_history_host_action",
      description:
        "Record the bounded receipt for a Canvasight Project History native host action. Call only after a widget-generated prompt supplied a short-lived token and you actually attempted the requested Codex navigation or task creation tool. This records metadata only; it never creates a task, changes Git, confirms, merges, or pushes.",
      inputSchema: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "Exact project path supplied by the Canvasight host-action prompt."
          },
          threadId: {
            type: "string",
            description: "Source Codex task id supplied by the Canvasight host-action prompt."
          },
          token: {
            type: "string",
            description: "Short-lived action-, node-, project-, and source-task-bound token supplied by the widget."
          },
          outcome: {
            type: "string",
            enum: ["succeeded", "queued", "failed"],
            description: "Use succeeded only after a native host tool returned a target task; queued only when task creation returned clientThreadId; otherwise failed."
          },
          targetTaskId: {
            type: "string",
            description: "Opened original task id or newly created ready task id. Required for succeeded."
          },
          clientThreadId: {
            type: "string",
            description: "Queued task setup id returned by Codex. Required for queued and for the one allowed queued-to-succeeded promotion."
          },
          error: {
            type: "string",
            maxLength: 500,
            description: "Bounded native host error. Required only for failed."
          }
        },
        required: ["projectPath", "threadId", "token", "outcome"],
        additionalProperties: false
      },
      outputSchema: looseObjectOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false }
    },
    {
      name: "record_project_history_agent_check",
      description:
        "Record the bounded result of a Canvasight Project History functional check. Call only after the user started an Agent check from a History node and the resulting prompt supplied a short-lived token. Inspect and test the exact protected snapshot first. This tool records metadata only; it never confirms a node, writes Git, merges, or pushes.",
      inputSchema: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "Exact project path supplied by the widget check request."
          },
          threadId: {
            type: "string",
            description: "Current Codex task id that performed the check."
          },
          token: {
            type: "string",
            description: "Short-lived node- and project-bound token supplied by the widget request."
          },
          outcome: {
            type: "string",
            enum: ["passed", "failed"],
            description: "Passed only when the requested functional behavior and relevant checks were actually verified."
          },
          summary: {
            type: "string",
            maxLength: 500,
            description: "Concise conclusion describing what was functionally verified or why it failed."
          },
          evidence: {
            type: "array",
            maxItems: 20,
            items: { type: "string", maxLength: 280 },
            description: "Bounded commands, observations, or acceptance results. Never include secrets or full chat content."
          }
        },
        required: ["projectPath", "threadId", "token", "outcome", "summary", "evidence"],
        additionalProperties: false
      },
      outputSchema: looseObjectOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false }
    },
    {
      name: "canvasight_widget_api",
      description: "Internal app-only proxy for Canvasight native widget session APIs. The widget uses this instead of fetching localhost directly.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          method: { type: "string", enum: ["GET", "POST", "DELETE"] },
          body: {},
          openAttemptId: { type: "string" },
          widgetInstanceId: { type: "string" },
          startupStage: { type: "string", enum: ["starting", "connecting_bridge", "connecting_session", "hydrating_project", "ready", "failed"] },
          displayMode: { type: "string", enum: ["inline", "fullscreen", "pip", "unknown"] },
          threadId: { type: "string" },
          reactMounted: { type: "boolean" }
        },
        required: ["path", "method", "openAttemptId", "widgetInstanceId", "startupStage", "displayMode"],
        additionalProperties: false
      },
      outputSchema: looseObjectOutputSchema,
      _meta: {
        ui: { visibility: ["app"] }
      }
    },
    {
      name: "await_canvasight_widget_ready",
      description:
        "Wait for the real Canvasight native widget client to mount React, reach its daemon session API, and acknowledge ready. Call this after open_canvasight; only status=ready confirms that the canvas is visibly initialized.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Session id returned by open_canvasight."
          },
          openAttemptId: {
            type: "string",
            description: "Open attempt id returned by open_canvasight."
          },
          threadId: {
            type: "string",
            description: "Current Codex task id used to reject readiness from a different task."
          },
          widgetInstanceId: {
            type: "string",
            description: "Optional exact fullscreen widget instance id when the caller already observed it."
          },
          timeoutMs: {
            type: "number",
            minimum: 1,
            maximum: 300000,
            description: "Maximum wait in milliseconds. Defaults to 30000."
          }
        },
        required: ["sessionId", "openAttemptId", "threadId"],
        additionalProperties: false
      },
      outputSchema: looseObjectOutputSchema
    },
    {
      name: "await_canvasight_run",
      description: "Wait for a browser run payload from a Canvasight session. The current Codex thread receives and applies the run payload.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Optional session id. When omitted, Canvasight waits for the matching project queue."
          },
          projectPath: {
            type: "string",
            description: "Optional project path filter when attaching from another Codex thread. Defaults to the most recent Canvasight project when sessionId is omitted."
          },
          threadId: {
            type: "string",
            description: "Optional current Codex thread id for native Chat Run. Defaults to CODEX_THREAD_ID when available."
          },
          timeoutMs: {
            type: "number",
            minimum: 1
          }
        },
        additionalProperties: false
      },
      outputSchema: canvasightRunOutputSchema
    },
    {
      name: "close_canvasight",
      description: "Close a Canvasight session. This operation is idempotent.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string"
          }
        },
        required: ["sessionId"],
        additionalProperties: false
      }
    }
  ];
}
