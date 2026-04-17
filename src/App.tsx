import { useMemo, useState } from "react";
import { DIMENSION_OPTIONS, EMPTY_FILTER, GENERATION_STEPS } from "./constants";
import { DEFAULT_CONFIG, DEFAULT_DRAFT, createRunFromDraft, seedProjects, suggestBatchName } from "./data/mockData";
import { CaseDrawer } from "./components/CaseDrawer";
import { ProjectDetailPage } from "./components/ProjectDetailPage";
import { ProjectsPage } from "./components/ProjectsPage";
import { ResultPage } from "./components/ResultPage";
import { WorkspacePage } from "./components/WorkspacePage";
import { CaseFilterState, GenerationRun, Project, TestCase, WorkspaceDraft } from "./types";
import { downloadCsv, todayStamp } from "./utils";

type ViewState =
  | { page: "projects" }
  | { page: "project"; projectId: string }
  | { page: "workspace"; projectId: string; mode: "new" | "regenerate" | "append"; sourceRunId?: string }
  | { page: "results"; projectId: string; runId: string };

function App() {
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [view, setView] = useState<ViewState>({ page: "projects" });
  const [workspaceDraft, setWorkspaceDraft] = useState<WorkspaceDraft>(DEFAULT_DRAFT);
  const [generationStep, setGenerationStep] = useState<number>(-1);
  const [workspaceResult, setWorkspaceResult] = useState<{ projectId: string; runId: string } | null>(null);
  const [selectedCase, setSelectedCase] = useState<{ projectId: string; runId: string; caseId: string } | null>(null);
  const [caseFilters, setCaseFilters] = useState<CaseFilterState>(EMPTY_FILTER);

  const selectedProject = useMemo(() => {
    if (view.page === "project" || view.page === "workspace" || view.page === "results") {
      return projects.find((project) => project.id === view.projectId) ?? null;
    }
    return null;
  }, [projects, view]);

  const selectedRun = useMemo(() => {
    if (view.page === "results") {
      const project = projects.find((item) => item.id === view.projectId);
      return project?.runs.find((run) => run.id === view.runId) ?? null;
    }
    if (view.page === "workspace" && workspaceResult && workspaceResult.projectId === view.projectId) {
      const project = projects.find((item) => item.id === view.projectId);
      return project?.runs.find((run) => run.id === workspaceResult.runId) ?? null;
    }
    return null;
  }, [projects, view, workspaceResult]);

  const activeCase = useMemo(() => {
    if (!selectedCase) return null;
    const project = projects.find((item) => item.id === selectedCase.projectId);
    const run = project?.runs.find((item) => item.id === selectedCase.runId);
    return run?.cases.find((item) => item.id === selectedCase.caseId) ?? null;
  }, [projects, selectedCase]);
  const breadcrumbItems = useMemo(() => {
    const root = {
      label: "项目中心",
      active: view.page === "projects",
      onClick: () => setView({ page: "projects" as const }),
    };

    if (view.page === "projects" || !selectedProject) {
      return [root];
    }

    const projectNode = {
      label: selectedProject.name,
      active: view.page === "project",
      onClick: () => setView({ page: "project", projectId: selectedProject.id } as const),
    };

    if (view.page === "project") {
      return [root, projectNode];
    }

    if (view.page === "workspace") {
      return [
        root,
        projectNode,
        {
          label: "AI 生成工作台",
          active: true,
          onClick: () => {
            setWorkspaceResult(null);
            setGenerationStep(-1);
            setWorkspaceDraft({
              ...DEFAULT_DRAFT,
              config: {
                ...DEFAULT_CONFIG,
                businessDomain: selectedProject.businessDomain,
              },
            });
            setView({ page: "workspace", projectId: selectedProject.id, mode: "new" });
          },
        },
      ];
    }

    const runId = selectedRun?.id ?? selectedProject.runs[0]?.id;
    return [
      root,
      projectNode,
      {
        label: "用例列表",
        active: true,
        onClick: () => {
          if (!runId) return;
          setView({ page: "results", projectId: selectedProject.id, runId });
        },
      },
    ];
  }, [selectedProject, selectedRun?.id, view.page]);

  const openProject = (projectId: string): void => {
    setSelectedCase(null);
    setView({ page: "project", projectId });
  };

  const createProject = (payload: { name: string; description: string; businessDomain: string; note: string }): void => {
    const project: Project = {
      id: `project_${Date.now()}`,
      name: payload.name,
      description: payload.description,
      businessDomain: payload.businessDomain,
      note: payload.note || undefined,
      updatedAt: todayStamp(),
      runs: [],
    };
    setProjects((prev) => [project, ...prev]);
    setView({ page: "project", projectId: project.id });
  };

  const prepareWorkspace = (projectId: string, mode: "new" | "regenerate" | "append", sourceRunId?: string): void => {
    const project = projects.find((item) => item.id === projectId);
    const sourceRun = sourceRunId ? project?.runs.find((item) => item.id === sourceRunId) : undefined;
    if (!project) return;

    if (sourceRun) {
      const batchName =
        mode === "append"
          ? `${sourceRun.name}_追加`
          : mode === "regenerate"
            ? `${sourceRun.name}_重生成`
            : suggestBatchName(sourceRun.sourceTitle, sourceRun.config.granularity);

      setWorkspaceDraft({
        batchName,
        inputType: sourceRun.inputType,
        documentName: sourceRun.inputType === "文档" ? sourceRun.sourceTitle : "",
        textInput: sourceRun.inputType === "文本" ? sourceRun.sourceSummary : "",
        config: { ...sourceRun.config },
      });
    } else {
      setWorkspaceDraft({
        ...DEFAULT_DRAFT,
        config: {
          ...DEFAULT_CONFIG,
          businessDomain: project.businessDomain,
        },
      });
    }

    setWorkspaceResult(null);
    setGenerationStep(-1);
    setView({ page: "workspace", projectId, mode, sourceRunId });
  };

  const finalizeGeneration = (): void => {
    if (view.page !== "workspace") return;

    const project = projects.find((item) => item.id === view.projectId);
    const sourceRun = view.sourceRunId ? project?.runs.find((item) => item.id === view.sourceRunId) : undefined;
    if (!project) return;

    const draft: WorkspaceDraft = {
      ...workspaceDraft,
      batchName:
        workspaceDraft.batchName.trim() ||
        suggestBatchName(
          workspaceDraft.inputType === "文档" ? workspaceDraft.documentName : workspaceDraft.textInput,
          workspaceDraft.config.granularity,
        ),
    };

    if (view.mode === "append" && sourceRun) {
      draft.batchName = `${sourceRun.name}_追加_${new Date().toISOString().slice(0, 10)}`;
    }
    if (view.mode === "regenerate" && sourceRun) {
      draft.batchName = `${sourceRun.name}_重生成_${new Date().toISOString().slice(0, 10)}`;
    }

    const run = createRunFromDraft(draft);

    setProjects((prev) =>
      prev.map((item) => {
        if (item.id !== view.projectId) return item;
        return { ...item, updatedAt: todayStamp(), runs: [run, ...item.runs] };
      }),
    );

    setWorkspaceResult({ projectId: view.projectId, runId: run.id });
    setGenerationStep(-1);
  };

  const startGeneration = (): void => {
    if (view.page !== "workspace") return;
    if (workspaceDraft.inputType === "文档" && !workspaceDraft.documentName.trim()) {
      window.alert("请先上传或选择需求文档。");
      return;
    }
    if (workspaceDraft.inputType === "文本" && workspaceDraft.textInput.trim().length < 20) {
      window.alert("请输入至少 20 字的需求文本。");
      return;
    }
    if (!workspaceDraft.config.businessDomain.trim()) {
      window.alert("请填写业务域，业务域会显著影响知识库召回质量。");
      return;
    }
    if (workspaceDraft.config.dimensions.length === 0) {
      window.alert("请至少选择一个测试维度。");
      return;
    }

    setWorkspaceResult(null);
    setGenerationStep(0);

    const timer = window.setInterval(() => {
      setGenerationStep((step) => {
        if (step >= GENERATION_STEPS.length - 1) {
          window.clearInterval(timer);
          finalizeGeneration();
          return step;
        }
        return step + 1;
      });
    }, 850);
  };

  const openResults = (projectId: string, runId: string): void => {
    setSelectedCase(null);
    setCaseFilters(EMPTY_FILTER);
    setView({ page: "results", projectId, runId });
  };

  const updateCase = (projectId: string, runId: string, caseId: string, patch: Partial<TestCase>): void => {
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;
        return {
          ...project,
          updatedAt: todayStamp(),
          runs: project.runs.map((run) => {
            if (run.id !== runId) return run;
            const nextCases = run.cases.map((item) =>
              item.id === caseId ? { ...item, ...patch, edited: true, updatedAt: todayStamp() } : item,
            );
            return { ...run, caseCount: nextCases.length, cases: nextCases };
          }),
        };
      }),
    );
  };

  const duplicateCase = (projectId: string, runId: string, caseId: string): void => {
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;
        return {
          ...project,
          updatedAt: todayStamp(),
          runs: project.runs.map((run) => {
            if (run.id !== runId) return run;
            const target = run.cases.find((item) => item.id === caseId);
            if (!target) return run;
            const clone: TestCase = {
              ...target,
              id: `case_${Date.now()}`,
              name: `${target.name}（复制）`,
              edited: true,
              updatedAt: todayStamp(),
            };
            const nextCases = [clone, ...run.cases];
            return { ...run, caseCount: nextCases.length, cases: nextCases };
          }),
        };
      }),
    );
  };

  const deleteCase = (projectId: string, runId: string, caseId: string): void => {
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;
        return {
          ...project,
          updatedAt: todayStamp(),
          runs: project.runs.map((run) => {
            if (run.id !== runId) return run;
            const nextCases = run.cases.filter((item) => item.id !== caseId);
            return { ...run, caseCount: nextCases.length, cases: nextCases };
          }),
        };
      }),
    );
    setSelectedCase(null);
  };

  const exportBatch = (run: GenerationRun): void => {
    const rows = [
      ["用例名称", "等级", "分组", "前置步骤", "测试步骤", "预期结果", "来源", "测试维度", "高风险", "是否编辑"],
      ...run.cases.map((item) => [
        item.name,
        item.level,
        item.group,
        item.precondition,
        item.steps,
        item.expected,
        item.source.join(" / "),
        item.dimensions.join(" / "),
        item.highRisk ? "是" : "否",
        item.edited ? "是" : "否",
      ]),
    ];
    downloadCsv(`${run.name}.csv`, rows);
  };

  const exportProjectCases = (project: Project): void => {
    const rows = [
      ["批次", "用例名称", "等级", "分组", "前置步骤", "测试步骤", "预期结果"],
      ...project.runs.flatMap((run) =>
        run.cases.map((item) => [run.name, item.name, item.level, item.group, item.precondition, item.steps, item.expected]),
      ),
    ];
    downloadCsv(`${project.name}_全部用例.csv`, rows);
  };

  const saveRunToBaseline = (projectId: string, runId: string): void => {
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;
        return {
          ...project,
          runs: project.runs.map((run) => {
            if (run.id !== runId) return run;
            return { ...run, cases: run.cases.map((item) => ({ ...item, inBaseline: true, updatedAt: todayStamp() })) };
          }),
        };
      }),
    );
    window.alert("当前批次用例已标记为项目基线资产。");
  };

  return (
    <div className="app-shell">
      <main className="content-area">
        <header className="top-bar">
          <div className="brand-row">
            <div className="logo-dot" />
            <div>
              <h1 className="top-title">AI 测试用例生成平台</h1>
              <p className="top-subtitle">项目层负责业务归属，批次层负责隔离输入，用例层负责编辑与导出。</p>
            </div>
          </div>
        </header>

        <nav className="path-nav" aria-label="路径导航">
          {breadcrumbItems.map((item, index) => (
            <span key={`${item.label}_${index}`} className="path-part-wrap">
              {item.active ? (
                <span className="path-link active">{item.label}</span>
              ) : (
                <button className="path-link path-link-btn" onClick={item.onClick}>
                  {item.label}
                </button>
              )}
              {index < breadcrumbItems.length - 1 && <span className="path-sep">/</span>}
            </span>
          ))}
        </nav>

        {view.page === "projects" && <ProjectsPage projects={projects} onOpen={openProject} onCreate={createProject} />}
        {view.page === "project" && selectedProject && (
          <ProjectDetailPage
            project={selectedProject}
            onBack={() => setView({ page: "projects" })}
            onCreateRun={() => prepareWorkspace(selectedProject.id, "new")}
            onViewRun={(runId) => openResults(selectedProject.id, runId)}
            onRegenerate={(runId) => prepareWorkspace(selectedProject.id, "regenerate", runId)}
            onCopyConfig={(runId) => prepareWorkspace(selectedProject.id, "new", runId)}
            onExportProject={() => exportProjectCases(selectedProject)}
          />
        )}
        {view.page === "workspace" && selectedProject && (
          <WorkspacePage
            project={selectedProject}
            draft={workspaceDraft}
            generationStep={generationStep}
            previewRun={selectedRun}
            onBack={() => setView({ page: "project", projectId: selectedProject.id })}
            onStart={startGeneration}
            onOpenResult={(runId) => openResults(selectedProject.id, runId)}
            onDraftChange={setWorkspaceDraft}
          />
        )}
        {view.page === "results" && selectedProject && selectedRun && (
          <ResultPage
            project={selectedProject}
            run={selectedRun}
            filters={caseFilters}
            dimensions={DIMENSION_OPTIONS}
            onBack={() => setView({ page: "project", projectId: selectedProject.id })}
            onFiltersChange={setCaseFilters}
            onExport={() => exportBatch(selectedRun)}
            onRegenerate={() => prepareWorkspace(selectedProject.id, "regenerate", selectedRun.id)}
            onAppend={() => prepareWorkspace(selectedProject.id, "append", selectedRun.id)}
            onSaveAssets={() => saveRunToBaseline(selectedProject.id, selectedRun.id)}
            onOpenCase={(caseId) => setSelectedCase({ projectId: selectedProject.id, runId: selectedRun.id, caseId })}
          />
        )}
      </main>

      {selectedCase && activeCase && (
        <CaseDrawer
          testCase={activeCase}
          onClose={() => setSelectedCase(null)}
          onSave={(patch) => updateCase(selectedCase.projectId, selectedCase.runId, activeCase.id, patch)}
          onCopy={() => duplicateCase(selectedCase.projectId, selectedCase.runId, activeCase.id)}
          onDelete={() => deleteCase(selectedCase.projectId, selectedCase.runId, activeCase.id)}
        />
      )}
    </div>
  );
}

export default App;


