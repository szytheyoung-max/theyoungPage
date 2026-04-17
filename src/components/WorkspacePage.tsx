import { ChangeEvent } from "react";
import { DIMENSION_OPTIONS, GENERATION_STEPS, GRANULARITY_OPTIONS, PLATFORM_OPTIONS } from "../constants";
import { suggestBatchName } from "../data/mockData";
import { Dimension, GenerationRun, Project, WorkspaceDraft } from "../types";
import { trimText } from "../utils";

interface WorkspacePageProps {
  project: Project;
  draft: WorkspaceDraft;
  generationStep: number;
  previewRun: GenerationRun | null;
  onBack: () => void;
  onStart: () => void;
  onOpenResult: (runId: string) => void;
  onDraftChange: (next: WorkspaceDraft) => void;
}

export function WorkspacePage({
  project,
  draft,
  generationStep,
  previewRun,
  onBack,
  onStart,
  onOpenResult,
  onDraftChange,
}: WorkspacePageProps) {
  const isGenerating = generationStep >= 0;

  const toggleDimension = (value: Dimension): void => {
    const current = draft.config.dimensions;
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    onDraftChange({
      ...draft,
      config: {
        ...draft.config,
        dimensions: next,
      },
    });
  };

  const progress = isGenerating ? Math.round(((generationStep + 1) / GENERATION_STEPS.length) * 100) : 0;

  return (
    <section>
      <div className="section-title-row">
        <div>
          <button className="text-btn" onClick={onBack}>
            返回批次列表
          </button>
          <h2 className="section-title">AI 生成工作台</h2>
          <p className="section-subtitle">项目：{project.name}</p>
        </div>
      </div>

      <div className="workspace-grid">
        <div className="panel">
          <div className="panel-block">
            <h3>输入方式</h3>
            <div className="tab-row">
              <button
                className={`tab-btn ${draft.inputType === "文档" ? "active" : ""}`}
                onClick={() => onDraftChange({ ...draft, inputType: "文档" })}
              >
                上传文档
              </button>
              <button
                className={`tab-btn ${draft.inputType === "文本" ? "active" : ""}`}
                onClick={() => onDraftChange({ ...draft, inputType: "文本" })}
              >
                文本输入
              </button>
            </div>

            {draft.inputType === "文档" ? (
              <label className="upload-box">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    onDraftChange({
                      ...draft,
                      documentName: file.name,
                      batchName: draft.batchName || suggestBatchName(file.name, draft.config.granularity),
                    });
                  }}
                />
                <strong>{draft.documentName || "拖拽文件到这里，或点击上传"}</strong>
                <p>支持 PDF / DOCX / TXT / Markdown</p>
              </label>
            ) : (
              <label>
                <textarea
                  rows={6}
                  placeholder="请输入需求描述、用户故事、业务流程、接口说明等内容"
                  value={draft.textInput}
                  onChange={(e) => onDraftChange({ ...draft, textInput: e.target.value })}
                />
                <small className="muted">字数统计：{draft.textInput.length}</small>
              </label>
            )}
          </div>

          <div className="panel-block">
            <h3>生成配置</h3>

            <label>
              批次名称（可编辑）
              <input value={draft.batchName} onChange={(e) => onDraftChange({ ...draft, batchName: e.target.value })} />
            </label>

            <label className="domain-label">
              业务域（重点字段）
              <input
                value={draft.config.businessDomain}
                onChange={(e) =>
                  onDraftChange({
                    ...draft,
                    config: { ...draft.config, businessDomain: e.target.value },
                  })
                }
                placeholder="例如：电商-支付结算"
              />
              <small className="warning-text">业务域会显著影响知识库召回质量，建议填写到二级域。</small>
            </label>

            <div className="option-group">
              <span className="group-title">目标平台</span>
              <div className="choice-row">
                {PLATFORM_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip ${draft.config.platform === item ? "active" : ""}`}
                    onClick={() => onDraftChange({ ...draft, config: { ...draft.config, platform: item } })}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {draft.config.platform === "Web" && <p className="hint">将重点补充浏览器兼容、分辨率与交互控件测试点。</p>}
              {(draft.config.platform === "安卓" || draft.config.platform === "iOS") && (
                <p className="hint">将重点补充机型、系统版本、权限、网络与安装升级测试点。</p>
              )}
            </div>

            <div className="option-group">
              <span className="group-title">测试维度（多选）</span>
              <div className="choice-row">
                {DIMENSION_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip ${draft.config.dimensions.includes(item) ? "active" : ""}`}
                    onClick={() => toggleDimension(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="option-group">
              <span className="group-title">用例颗粒度</span>
              <div className="choice-row">
                {GRANULARITY_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip ${draft.config.granularity === item ? "active" : ""}`}
                    onClick={() => onDraftChange({ ...draft, config: { ...draft.config, granularity: item } })}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <p className="hint">
                {draft.config.granularity === "粗略" && "粗略：更适合快速评审。"}
                {draft.config.granularity === "标准" && "标准：适合日常测试设计。"}
                {draft.config.granularity === "详细" && "详细：适合关键链路、核心模块。"}
              </p>
            </div>

            <label>
              自定义 Prompt（可选）
              <textarea
                rows={3}
                value={draft.config.customPrompt}
                onChange={(e) => onDraftChange({ ...draft, config: { ...draft.config, customPrompt: e.target.value } })}
                placeholder="请重点关注优惠叠加和金额计算；请按团队标准模板输出；请避免重复用例"
              />
            </label>

            <label className="upload-box lite">
              上传参考用例（可选，CSV/Excel）
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  onDraftChange({ ...draft, config: { ...draft.config, refCaseFileName: file.name } });
                }}
              />
              <p>{draft.config.refCaseFileName || "未上传参考用例文件"}</p>
              {draft.config.refCaseFileName && (
                <small className="muted">已识别字段：用例名称 / 步骤 / 预期结果；风格学习状态：成功</small>
              )}
            </label>
          </div>

          <button className="btn btn-primary" onClick={onStart} disabled={isGenerating}>
            {isGenerating ? "生成中..." : "开始生成"}
          </button>
        </div>

        <div className="panel side">
          <h3>生成辅助与预览</h3>

          {!isGenerating && !previewRun && (
            <div className="status-card">
              <strong>未开始生成</strong>
              <ul>
                <li>请先选择输入方式并填写业务域。</li>
                <li>建议优先提供结构化 PRD 或完整业务流程描述。</li>
                <li>生成后将输出：用例名称、等级、分组、步骤、预期结果。</li>
              </ul>
            </div>
          )}

          {isGenerating && (
            <div className="status-card">
              <strong>生成中（{progress}%）</strong>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p>{GENERATION_STEPS[generationStep]}</p>
            </div>
          )}

          {!isGenerating && previewRun && (
            <div className="status-card done">
              <strong>生成完成预览</strong>
              <div className="summary-mini">
                <span>识别功能点：{previewRun.recognizedFeatureCount}</span>
                <span>生成用例：{previewRun.caseCount}</span>
                <span>命中知识库：{previewRun.knowledgeHits.join(" / ")}</span>
                <span>平台适配：{previewRun.platformNote}</span>
              </div>

              <div className="preview-case-list">
                {previewRun.cases.slice(0, 3).map((item) => (
                  <div key={item.id} className="preview-item">
                    <span>{item.name}</span>
                    <small>{trimText(item.expected, 28)}</small>
                  </div>
                ))}
              </div>

              <button className="btn btn-primary" onClick={() => onOpenResult(previewRun.id)}>
                进入结果页
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
