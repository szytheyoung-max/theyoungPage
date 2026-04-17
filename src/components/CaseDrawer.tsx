import { useEffect, useState } from "react";
import { TestCase } from "../types";

interface CaseDrawerProps {
  testCase: TestCase;
  onClose: () => void;
  onSave: (patch: Partial<TestCase>) => void;
  onCopy: () => void;
  onDelete: () => void;
}

export function CaseDrawer({ testCase, onClose, onSave, onCopy, onDelete }: CaseDrawerProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<TestCase>(testCase);

  useEffect(() => {
    setDraft(testCase);
    setIsEditing(false);
  }, [testCase]);

  const saveEdit = (): void => {
    onSave({
      name: draft.name,
      level: draft.level,
      group: draft.group,
      precondition: draft.precondition,
      steps: draft.steps,
      expected: draft.expected,
      highValue: draft.highValue,
      inBaseline: draft.inBaseline,
    });
    setIsEditing(false);
  };

  return (
    <div className="drawer-mask" onClick={onClose}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <h3>用例详情</h3>
          <button className="btn btn-ghost" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="drawer-body">
          <label>
            用例名称
            <input value={draft.name} disabled={!isEditing} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <div className="row-2">
            <label>
              用例等级
              <select value={draft.level} disabled={!isEditing} onChange={(e) => setDraft({ ...draft, level: e.target.value as TestCase["level"] })}>
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
              </select>
            </label>
            <label>
              分组
              <input value={draft.group} disabled={!isEditing} onChange={(e) => setDraft({ ...draft, group: e.target.value })} />
            </label>
          </div>

          <label>
            前置步骤
            <textarea rows={3} value={draft.precondition} disabled={!isEditing} onChange={(e) => setDraft({ ...draft, precondition: e.target.value })} />
          </label>
          <label>
            测试步骤
            <textarea rows={4} value={draft.steps} disabled={!isEditing} onChange={(e) => setDraft({ ...draft, steps: e.target.value })} />
          </label>
          <label>
            预期结果
            <textarea rows={4} value={draft.expected} disabled={!isEditing} onChange={(e) => setDraft({ ...draft, expected: e.target.value })} />
          </label>

          <div className="meta-block">
            <h4>增强信息</h4>
            <p>AI 生成依据摘要：结合业务域知识库和输入内容自动抽取测试点。</p>
            <p>关联测试维度：{draft.dimensions.join(" / ")}</p>
            <p>来源标签：{draft.source.join(" / ")}</p>
          </div>
        </div>

        <div className="drawer-footer">
          {!isEditing ? (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              编辑
            </button>
          ) : (
            <button className="btn btn-primary" onClick={saveEdit}>
              保存修改
            </button>
          )}
          <button className="btn btn-light" onClick={onCopy}>
            复制
          </button>
          <button
            className="btn btn-light"
            onClick={() => {
              const next = !draft.highValue;
              setDraft({ ...draft, highValue: next });
              onSave({ highValue: next });
            }}
          >
            {draft.highValue ? "取消高价值" : "标记高价值"}
          </button>
          <button
            className="btn btn-light"
            onClick={() => {
              const next = !draft.inBaseline;
              setDraft({ ...draft, inBaseline: next });
              onSave({ inBaseline: next });
            }}
          >
            {draft.inBaseline ? "移出基线库" : "加入基线库"}
          </button>
          <button className="btn btn-danger" onClick={onDelete}>
            删除
          </button>
        </div>
      </aside>
    </div>
  );
}
