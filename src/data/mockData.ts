import { CaseSource, Dimension, GenerationRun, Granularity, Platform, Project, RunConfig, TestCase, WorkspaceDraft } from "../types";

const BASE_DIMENSIONS: Dimension[] = ["正向流程", "异常流程", "边界值"];

const CASE_GROUPS = [
  "登录注册",
  "权限策略",
  "金额计算",
  "消息通知",
  "数据展示",
  "配置流程",
  "兼容性检查",
  "异常恢复",
];

const STEP_PATTERNS = [
  "打开系统并进入目标页面，按流程输入合法参数后提交",
  "在关键字段输入异常值并触发保存动作",
  "切换不同角色或权限后重复相同操作",
  "在弱网场景下重试主流程并观察状态变化",
  "跨端登录后执行相同业务动作并核对一致性",
];

const EXPECT_PATTERNS = [
  "页面反馈与后端状态一致，不出现错误提示，日志记录完整",
  "系统阻止非法提交并提示具体原因，不影响其他流程",
  "权限受限账号不可见敏感入口，拥有权限账号可完整执行",
  "异常重试后状态恢复正确，不产生重复数据",
  "跨端行为一致，关键字段与计算结果完全一致",
];

export const DEFAULT_CONFIG: RunConfig = {
  platform: "不限",
  dimensions: BASE_DIMENSIONS,
  granularity: "标准",
  businessDomain: "",
  customPrompt: "",
  refCaseFileName: "",
};

export const DEFAULT_DRAFT: WorkspaceDraft = {
  batchName: "",
  inputType: "文档",
  documentName: "",
  textInput: "",
  config: DEFAULT_CONFIG,
};

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function caseCountByGranularity(granularity: Granularity): number {
  if (granularity === "粗略") return 9;
  if (granularity === "详细") return 30;
  return 18;
}

function platformNote(platform: Platform): string {
  if (platform === "Web") {
    return "重点补充浏览器兼容、分辨率与交互控件测试点";
  }
  if (platform === "iOS" || platform === "安卓") {
    return "重点补充机型、系统版本、权限、网络与安装升级测试点";
  }
  return "按通用流程生成基础测试点，并按维度补齐异常与边界覆盖";
}

function knowledgeHitsByDomain(domain: string): string[] {
  if (domain.includes("支付")) return ["资金安全基线", "金额计算规则", "支付链路失败补偿"];
  if (domain.includes("权限")) return ["RBAC 基线", "越权访问风险", "角色切换回归点"];
  if (domain.includes("内容")) return ["审核策略", "敏感词策略", "发布流程回滚"];
  return ["通用业务流程库", "异常场景库", "高风险测试清单"];
}

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function createCase(index: number, dimensions: Dimension[]): TestCase {
  const level = index % 7 === 0 ? "P0" : index % 2 === 0 ? "P1" : "P2";
  const group = pick(CASE_GROUPS, index);
  const precondition = `已准备 ${group} 相关测试数据，账号状态满足执行条件，环境可访问。`;
  const steps = `${pick(STEP_PATTERNS, index)}（样例 ${index + 1}）`;
  const expected = `${pick(EXPECT_PATTERNS, index)}。`;
  const source: CaseSource[] =
    index % 3 === 0 ? ["AI", "知识库"] : index % 4 === 0 ? ["AI", "参考风格"] : ["AI"];

  return {
    id: uid("case"),
    name: `${group} - 场景 ${index + 1}`,
    level,
    group,
    precondition,
    steps,
    expected,
    source,
    dimensions,
    highRisk: level === "P0" || index % 6 === 0,
    edited: false,
    highValue: false,
    inBaseline: false,
    updatedAt: nowIso(),
  };
}

export function suggestBatchName(inputTitle: string, granularity: Granularity): string {
  const date = new Date().toISOString().slice(0, 10);
  const normalizedTitle = inputTitle.trim() || "需求输入";
  return `${normalizedTitle}_${granularity}_${date}`;
}

export function createRunFromDraft(draft: WorkspaceDraft): GenerationRun {
  const count = caseCountByGranularity(draft.config.granularity);
  const caseList = Array.from({ length: count }, (_, i) => createCase(i, draft.config.dimensions));
  const sourceTitle =
    draft.inputType === "文档"
      ? draft.documentName || "未命名文档"
      : `${draft.textInput.slice(0, 20) || "文本输入"}${draft.textInput.length > 20 ? "..." : ""}`;

  return {
    id: uid("run"),
    name: draft.batchName || suggestBatchName(sourceTitle, draft.config.granularity),
    inputType: draft.inputType,
    sourceTitle,
    sourceSummary:
      draft.inputType === "文档"
        ? `根据文档 ${sourceTitle} 自动提取功能点并生成`
        : `根据文本输入自动拆解功能点并生成`,
    createdAt: nowIso(),
    status: "已完成",
    config: draft.config,
    caseCount: caseList.length,
    recognizedFeatureCount: Math.max(5, Math.floor(caseList.length / 3)),
    knowledgeHits: knowledgeHitsByDomain(draft.config.businessDomain),
    platformNote: platformNote(draft.config.platform),
    cases: caseList,
  };
}

export const seedProjects: Project[] = [
  {
    id: "project_1",
    name: "电商支付改版",
    description: "覆盖支付成功、失败、退款与优惠叠加计算链路",
    businessDomain: "电商-支付结算",
    note: "Q2 核心改造项目",
    updatedAt: "2026-04-16T10:00:00.000Z",
    runs: [
      {
        id: "run_1",
        name: "支付链路_PRD_v1_标准_2026-04-15",
        inputType: "文档",
        sourceTitle: "支付链路 PRD v1.docx",
        sourceSummary: "覆盖收银台、支付渠道、失败补偿与退款",
        createdAt: "2026-04-15T08:30:00.000Z",
        status: "已完成",
        config: {
          platform: "Web",
          dimensions: ["正向流程", "异常流程", "边界值", "兼容性测试"],
          granularity: "标准",
          businessDomain: "电商-支付结算",
          customPrompt: "重点关注优惠叠加与金额精度问题",
          refCaseFileName: "支付历史用例.xlsx",
        },
        caseCount: 18,
        recognizedFeatureCount: 7,
        knowledgeHits: ["资金安全基线", "金额计算规则", "支付链路失败补偿"],
        platformNote: "重点补充浏览器兼容、分辨率与交互控件测试点",
        cases: Array.from({ length: 18 }, (_, i) => createCase(i, ["正向流程", "异常流程", "边界值", "兼容性测试"])),
      },
    ],
  },
  {
    id: "project_2",
    name: "用户中心权限优化",
    description: "优化角色配置、菜单权限与接口鉴权策略",
    businessDomain: "企业协同-权限管理",
    note: "灰度阶段",
    updatedAt: "2026-04-14T09:00:00.000Z",
    runs: [
      {
        id: "run_2",
        name: "权限系统补充需求_文本输入_2026-04-14",
        inputType: "文本",
        sourceTitle: "权限补充需求说明",
        sourceSummary: "角色继承、菜单权限、越权拦截、审计日志",
        createdAt: "2026-04-14T09:15:00.000Z",
        status: "已完成",
        config: {
          platform: "不限",
          dimensions: ["正向流程", "异常流程", "权限测试"],
          granularity: "粗略",
          businessDomain: "企业协同-权限管理",
          customPrompt: "请补充越权访问与角色切换的回归点",
          refCaseFileName: "",
        },
        caseCount: 9,
        recognizedFeatureCount: 5,
        knowledgeHits: ["RBAC 基线", "越权访问风险", "角色切换回归点"],
        platformNote: "按通用流程生成基础测试点，并按维度补齐异常与边界覆盖",
        cases: Array.from({ length: 9 }, (_, i) => createCase(i, ["正向流程", "异常流程", "权限测试"])),
      },
    ],
  },
];
