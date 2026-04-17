import { useMemo } from "react";
import { CaseFilterState, Dimension, GenerationRun, Project } from "../types";
import { toDateTime, trimText } from "../utils";

interface ResultPageProps {
  project: Project;
  run: GenerationRun;
  filters: CaseFilterState;
  dimensions: Dimension[];
  onFiltersChange: (filters: CaseFilterState) => void;
  onBack: () => void;
  onRegenerate: () => void;
  onAppend: () => void;
  onExport: () => void;
  onSaveAssets: () => void;
  onOpenCase: (caseId: string) => void;
}

export function ResultPage({
  project,
  run,
  filters,
  dimensions,
  onFiltersChange,
  onBack,
  onRegenerate,
  onAppend,
  onExport,
  onSaveAssets,
  onOpenCase,
}: ResultPageProps) {
  const groups = useMemo(() => ["全部", ...new Set(run.cases.map((item) => item.group))], [run.cases]);

  const filteredCases = useMemo(
    () =>
      run.cases.filter((item) => {
        const text = `${item.name} ${item.steps} ${item.expected}`.toLowerCase();
        const passQuery = text.includes(filters.query.trim().toLowerCase());
        const passLevel = filters.level === "全部" || item.level === filters.level;
        const passGroup = filters.group === "全部" || item.group === filters.group;
        const passDimension = filters.dimension === "全部" || item.dimensions.includes(filters.dimension);
        const passHighRisk = !filters.highRiskOnly || item.highRisk;
        const passEdited = !filters.editedOnly || item.edited;
        return passQuery && passLevel && passGroup && passDimension && passHighRisk && passEdited;
      }),
    [filters, run.cases],
  );

  return (
    <section>
      <div className="section-title-row">
        <div>
          <button className="text-btn" onClick={onBack}>
            返回批次列表
          </button>
          <h2 className="section-title">生成结果 / 用例列表</h2>
          <p className="section-subtitle">
            项目：{project.name} · 批次：{run.name}
          </p>
        </div>

        <div className="row-gap">
          <button className="btn btn-light" onClick={onRegenerate}>
            重新生成
          </button>
          <button className="btn btn-light" onClick={onAppend}>
            追加生成
          </button>
          <button className="btn btn-light" onClick={onExport}>
            导出 Excel / CSV
          </button>
          <button className="btn btn-primary" onClick={onSaveAssets}>
            保存为项目资产
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>来源</span>
          <strong>{run.sourceTitle}</strong>
        </div>
        <div className="summary-card">
          <span>生成配置</span>
          <strong>
            {run.config.platform} / {run.config.granularity}
          </strong>
        </div>
        <div className="summary-card">
          <span>生成时间</span>
          <strong>{toDateTime(run.createdAt)}</strong>
        </div>
        <div className="summary-card">
          <span>用例总数</span>
          <strong>{run.caseCount}</strong>
        </div>
      </div>

      <div className="toolbar wide">
        <input
          placeholder="搜索用例名称/步骤/预期结果"
          value={filters.query}
          onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
        />
        <select value={filters.level} onChange={(event) => onFiltersChange({ ...filters, level: event.target.value as CaseFilterState["level"] })}>
          <option value="全部">全部等级</option>
          <option value="P0">P0</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
        </select>
        <select value={filters.group} onChange={(event) => onFiltersChange({ ...filters, group: event.target.value })}>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
        <select
          value={filters.dimension}
          onChange={(event) => onFiltersChange({ ...filters, dimension: event.target.value as CaseFilterState["dimension"] })}
        >
          <option value="全部">全部维度</option>
          {dimensions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <label className="toggle">
          <input
            type="checkbox"
            checked={filters.highRiskOnly}
            onChange={(event) => onFiltersChange({ ...filters, highRiskOnly: event.target.checked })}
          />
          仅看高风险
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={filters.editedOnly}
            onChange={(event) => onFiltersChange({ ...filters, editedOnly: event.target.checked })}
          />
          仅看已编辑
        </label>
      </div>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>用例名称</th>
              <th>等级</th>
              <th>分组</th>
              <th>前置步骤</th>
              <th>测试步骤</th>
              <th>预期结果</th>
              <th>来源</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((item) => (
              <tr key={item.id} className="clickable-row" onClick={() => onOpenCase(item.id)}>
                <td>{item.name}</td>
                <td>
                  <span className={`level ${item.level.toLowerCase()}`}>{item.level}</span>
                </td>
                <td>{item.group}</td>
                <td>{trimText(item.precondition, 16)}</td>
                <td>{trimText(item.steps, 16)}</td>
                <td>{trimText(item.expected, 16)}</td>
                <td>{item.source.join(" / ")}</td>
                <td>
                  <button className="mini-btn" onClick={() => onOpenCase(item.id)}>
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
