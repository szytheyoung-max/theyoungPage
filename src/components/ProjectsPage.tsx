import { FormEvent, useMemo, useState } from "react";
import { Project } from "../types";
import { toDateTime } from "../utils";

interface ProjectsPageProps {
  projects: Project[];
  onOpen: (projectId: string) => void;
  onCreate: (payload: { name: string; description: string; businessDomain: string; note: string }) => void;
}

export function ProjectsPage({ projects, onOpen, onCreate }: ProjectsPageProps) {
  const [search, setSearch] = useState<string>("");
  const [domainFilter, setDomainFilter] = useState<string>("全部");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [form, setForm] = useState({ name: "", description: "", businessDomain: "", note: "" });

  const domainOptions = useMemo(() => ["全部", ...new Set(projects.map((item) => item.businessDomain))], [projects]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const text = `${project.name} ${project.description}`.toLowerCase();
        const passText = text.includes(search.trim().toLowerCase());
        const passDomain = domainFilter === "全部" || project.businessDomain === domainFilter;
        return passText && passDomain;
      }),
    [projects, search, domainFilter],
  );

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!form.name.trim()) {
      window.alert("项目名称不能为空。");
      return;
    }
    if (!form.businessDomain.trim()) {
      window.alert("请填写默认业务域。");
      return;
    }

    onCreate({
      name: form.name.trim(),
      description: form.description.trim() || "暂无描述",
      businessDomain: form.businessDomain.trim(),
      note: form.note.trim(),
    });
    setForm({ name: "", description: "", businessDomain: "", note: "" });
    setShowModal(false);
  };

  return (
    <section>
      <div className="section-title-row">
        <div>
          <h2 className="section-title">项目中心</h2>
          <p className="section-subtitle">先进入业务上下文，再创建和管理生成批次。</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          新建项目
        </button>
      </div>

      <div className="toolbar">
        <input placeholder="搜索项目名称/描述" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
          {domainOptions.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
      </div>

      <div className="project-grid">
        {filteredProjects.map((project, index) => {
          const caseCount = project.runs.reduce((acc, run) => acc + run.caseCount, 0);
          return (
            <article key={project.id} className="project-card" style={{ animationDelay: `${index * 90}ms` }}>
              <div className="card-header">
                <span className="pill">{project.businessDomain}</span>
                <span className="muted">{toDateTime(project.updatedAt)}</span>
              </div>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <div className="stat-row">
                <div>
                  <span className="stat-label">生成批次</span>
                  <strong>{project.runs.length}</strong>
                </div>
                <div>
                  <span className="stat-label">测试用例</span>
                  <strong>{caseCount}</strong>
                </div>
              </div>
              <div className="card-actions">
                <button className="btn btn-light" onClick={() => onOpen(project.id)}>
                  进入项目
                </button>
                <button className="btn btn-ghost">更多操作</button>
              </div>
            </article>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-mask">
          <form className="modal-card" onSubmit={submit}>
            <h3>新建项目</h3>
            <label>
              项目名称
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="例如：电商支付改版"
              />
            </label>
            <label>
              项目描述
              <textarea rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </label>
            <label>
              默认业务域
              <input
                value={form.businessDomain}
                onChange={(e) => setForm((prev) => ({ ...prev, businessDomain: e.target.value }))}
                placeholder="例如：电商-支付结算"
              />
            </label>
            <label>
              备注（可选）
              <input value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                取消
              </button>
              <button type="submit" className="btn btn-primary">
                创建并进入
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
