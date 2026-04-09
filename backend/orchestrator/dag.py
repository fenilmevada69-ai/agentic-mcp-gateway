import networkx as nx
from loguru import logger
from typing import List, Dict, Any

class DAGEngine:
    """
    Builds and analyzes the workflow DAG using NetworkX.
    
    What it does:
    - Takes steps from the AI plan
    - Builds a directed graph (nodes = steps, edges = dependencies)
    - Figures out execution order using topological sort
    - Groups steps that can run in parallel
    """

    def __init__(self):
        self.graph = nx.DiGraph()  # Directed graph
        logger.info("[DAG] Engine initialized")

    def build_graph(self, steps: List[Dict[str, Any]]) -> nx.DiGraph:
        """
        Build the DAG from the list of steps.
        Each step becomes a node.
        Each dependency becomes a directed edge.
        """
        self.graph.clear()

        # Add all steps as nodes
        for step in steps:
            self.graph.add_node(
                step["id"],
                tool=step["tool"],
                parameters=step.get("parameters", {}),
                description=step.get("description", ""),
                needs_approval=step.get("needs_approval", False),
                depends_on=step.get("depends_on", [])
            )

        # Add edges (dependencies)
        for step in steps:
            for dependency in step.get("depends_on", []):
                self.graph.add_edge(dependency, step["id"])
                # This means: dependency must complete BEFORE step["id"] runs

        logger.info(f"[DAG] Graph built: {len(self.graph.nodes)} nodes, {len(self.graph.edges)} edges")

        # Validate — check for circular dependencies (would cause infinite loop)
        if not nx.is_directed_acyclic_graph(self.graph):
            raise ValueError("Circular dependency detected in workflow plan!")

        return self.graph

    def get_execution_order(self) -> List[List[str]]:
        """
        Returns steps grouped by execution wave.
        
        Wave 1 = steps with no dependencies (run first, in parallel)
        Wave 2 = steps whose dependencies are all in Wave 1 (run next, in parallel)
        Wave 3 = steps whose dependencies are all in Wave 1+2
        ...and so on
        
        Example:
        Wave 1: [step_1]           ← no dependencies
        Wave 2: [step_2]           ← depends on step_1
        Wave 3: [step_3a, step_3b] ← both depend on step_2, run in PARALLEL
        """
        waves = []
        remaining = set(self.graph.nodes)
        completed = set()

        while remaining:
            # Find all steps whose dependencies are all completed
            current_wave = []
            for node in remaining:
                dependencies = set(self.graph.predecessors(node))
                if dependencies.issubset(completed):
                    current_wave.append(node)

            if not current_wave:
                raise ValueError("Cannot resolve execution order — possible circular dependency")

            waves.append(current_wave)
            completed.update(current_wave)
            remaining -= set(current_wave)

        logger.info(f"[DAG] Execution order: {waves}")
        return waves

    def get_step_data(self, step_id: str) -> Dict:
        """Get all data for a specific step node"""
        return dict(self.graph.nodes[step_id])

    def visualize_ascii(self, steps: List[Dict]) -> str:
        """
        Returns an ASCII visualization of the DAG.
        Used in the Web UI and logs to show judges the execution plan.
        """
        lines = ["\n📊 WORKFLOW DAG:\n"]
        waves = self.get_execution_order()

        for i, wave in enumerate(waves):
            wave_label = f"Wave {i+1}"
            if len(wave) > 1:
                wave_label += f" (PARALLEL ⚡)"
            lines.append(f"  {wave_label}:")

            for step_id in wave:
                step_data = self.get_step_data(step_id)
                approval = " 🔐 [NEEDS APPROVAL]" if step_data.get("needs_approval") else ""
                lines.append(f"    → {step_id}: {step_data['tool']}{approval}")
                lines.append(f"       └─ {step_data['description']}")

            if i < len(waves) - 1:
                lines.append("         ↓")

        return "\n".join(lines)