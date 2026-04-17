import { Project } from "../types";
import { toDateTime, trimText } from "../utils";

interface ProjectDetailPageProps {
  project: Project;
  onBack: () => void;
  onCreateRun: () => void;
  onViewRun: (runId: string) => void;
  onRegenerate: (runId: string) => void;
  onCopyConfig: (runId: string) => void;
  onExportProject: () => void;
}

export function ProjectDetailPage({
  project,
  onBack,
  onCreateRun,
  onViewRun,
  onRegenerate,
  onCopyConfig,
  onExportProject,
}: ProjectDetailPageProps) {
  const totalCases = project.runs.reduce((acc, item) => acc + item.caseCount, 0);

  return (
    <section>
      <div className="section-title-row">
        <div>
          <button className="text-btn" onClick={onBack}>
            返回项目列表
          </button>
          <h2 className="section-title">{project.name}</h2>
          <p className="section-subtitle">{project.description}</p>
        </div>

        <div className="row-gap">
          <button className="btn btn-primary" onClick={onCreateRun}>
            新建生成批次
          </button>
          <button className="btn btn-light" onClick={onExportProject}>
            导出项目用例
          </button>
          <button className="btn btn-ghost">查看基线库</button>
          <button className="btn btn-ghost">项目设置</button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>业务域</span>
          <strong>{project.businessDomain}</strong>
        </div>
        <div className="summary-card">
          <span>批次数量</span>
          <strong>{project.runs.length}</strong>
        </div>
        <div className="summary-card">
          <span>用例总数</span>
          <strong>{totalCases}</strong>
        </div>
        <div className="summary-card">
          <span>最近更新时间</span>
          <strong>{toDateTime(project.updatedAt)}</strong>
        </div>
      </div>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>批次名称</th>
              <th>输入来源</th>
              <th>文档名/摘要</th>
              <th>生成时间</th>
              <th>目标平台</th>
              <th>测试维度</th>
              <th>颗粒度</th>
              <th>用例数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {project.runs.map((run) => (
              <tr key={run.id}>
                <td>
                  <button className="batch-link" onClick={() => onViewRun(run.id)} title="进入该批次用例列表">
                    {run.name}
                  </button>
                </td>
                <td>{run.inputType}</td>
                <td>{trimText(run.sourceTitle, 24)}</td>
                <td>{toDateTime(run.createdAt)}</td>
                <td>{run.config.platform}</td>
                <td>{trimText(run.config.dimensions.join(" / "), 20)}</td>
                <td>{run.config.granularity}</td>
                <td>{run.caseCount}</td>
                <td>
                  <span className={`status ${run.status === "已完成" ? "done" : ""}`}>{run.status}</span>
                </td>
                <td>
                  <div className="cell-actions">
                    <button className="mini-btn" onClick={() => onRegenerate(run.id)}>
                      重新生成
                    </button>
                    <button className="mini-btn" onClick={() => onCopyConfig(run.id)}>
                      复制配置
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
