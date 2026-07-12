# Domain: task-execution

Use for implementation plans, migrations, bug fixes, launch work, operational workflows, or coordinated delivery.

## Required coverage

| Coverage key | Required content |
| --- | --- |
| `task.goalDone` | Concrete goal and observable definition of done. |
| `task.currentEvidence` | Verified current state, relevant evidence, and known gaps. |
| `task.constraints` | Behaviors, data, interfaces, or user work that must not be broken. |
| `task.workDependencies` | Work breakdown, order, prerequisites, and dependency reasoning. |
| `task.parallelWork` | Work that can safely run concurrently, or an explicit statement that none can. |
| `task.deliverables` | Files, artifacts, releases, decisions, or external results to deliver. |
| `task.risksRecovery` | Risks, blockers, stop conditions, rollback, and recovery. |
| `task.stageVerification` | Concrete verification paired with every major stage. |
| `task.acceptanceDelivery` | Final acceptance evidence, handoff, and delivery checks. |

Use current-status language accurately. Planned, in-progress, blocked, and verified are distinct; never label planned work complete.
