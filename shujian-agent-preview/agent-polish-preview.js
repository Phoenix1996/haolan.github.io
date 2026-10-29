(function () {
  "use strict";

  const appShell = document.getElementById("appShell");
  const chatBody = document.getElementById("chatBody");
  const welcomeState = document.getElementById("welcomeState");
  const resultContent = document.getElementById("resultContent");
  const resultEmpty = document.getElementById("resultEmpty");
  const currentConversation = document.getElementById("currentConversation");
  const conversationHeading = document.getElementById("conversationHeading");
  const conversationStatus = document.getElementById("conversationStatus");
  const promptInput = document.getElementById("promptInput");
  const toast = document.getElementById("toast");
  let toastTimer = 0;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2400);
  }

  function setView(view, updateUrl) {
    const isWelcome = view === "welcome";
    appShell.classList.toggle("is-welcome", isWelcome);
    chatBody.hidden = isWelcome;
    welcomeState.hidden = !isWelcome;
    resultContent.hidden = isWelcome;
    resultEmpty.hidden = !isWelcome;
    currentConversation.textContent = isWelcome ? "新对话" : "华东区营收与毛利率";
    conversationHeading.textContent = isWelcome ? "新对话" : "对话";
    conversationStatus.hidden = isWelcome;

    document.querySelectorAll("[data-view]").forEach(function (button) {
      const active = button.dataset.view === view;
      if (button.hasAttribute("aria-pressed")) {
        button.setAttribute("aria-pressed", String(active));
      }
      if (button.classList.contains("history-item")) {
        button.classList.toggle("is-active", active && view === "conversation");
        if (active && view === "conversation") {
          button.setAttribute("aria-current", "page");
        } else {
          button.removeAttribute("aria-current");
        }
      }
    });

    if (updateUrl) {
      const url = new URL(window.location.href);
      if (isWelcome) url.searchParams.set("view", "welcome");
      else url.searchParams.delete("view");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }

  document.querySelectorAll("[data-view]").forEach(function (button) {
    button.addEventListener("click", function () {
      setView(button.dataset.view, true);
      if (button.dataset.view === "welcome") {
        showToast("已切换到新对话预览。");
      }
    });
  });

  const initialView = new URLSearchParams(window.location.search).get("view") === "welcome"
    ? "welcome"
    : "conversation";
  setView(initialView, false);

  function toggleHistory() {
    const collapsed = appShell.classList.toggle("is-history-collapsed");
    const button = document.getElementById("collapseHistory");
    button.setAttribute("aria-expanded", String(!collapsed));
    button.setAttribute("aria-label", collapsed ? "展开对话历史" : "收起对话历史");
    button.title = collapsed ? "展开对话历史" : "收起对话历史";
  }

  document.getElementById("collapseHistory").addEventListener("click", toggleHistory);
  document.getElementById("mobileHistoryToggle").addEventListener("click", function () {
    const open = appShell.classList.toggle("mobile-history-open");
    this.setAttribute("aria-expanded", String(open));
    this.setAttribute("aria-label", open ? "收起对话历史" : "展开对话历史");
  });

  const composerMoreButton = document.getElementById("composerMoreButton");
  const composerMoreMenu = document.getElementById("composerMoreMenu");
  const composerModeHint = document.getElementById("composerModeHint");
  const modeOptions = {
    ordinary: { title: "普通问答", placeholder: "继续提问，或输入新的问题…" },
    acquisition: { title: "条件获客", placeholder: "描述目标客户与筛选条件…" },
    completion: { title: "名单补全", placeholder: "描述需要补充的名单字段…" }
  };

  function setComposerMenuOpen(open) {
    composerMoreMenu.hidden = !open;
    composerMoreButton.setAttribute("aria-expanded", String(open));
    composerMoreButton.classList.toggle("is-open", open);
  }

  composerMoreButton.addEventListener("click", function (event) {
    event.stopPropagation();
    setComposerMenuOpen(composerMoreMenu.hidden);
  });

  composerMoreMenu.addEventListener("click", function (event) {
    const item = event.target.closest("[data-mode]");
    if (!item) return;
    const mode = item.dataset.mode;
    const option = modeOptions[mode];
    if (!option) return;

    composerMoreMenu.querySelectorAll("[data-mode]").forEach(function (button) {
      const active = button === item;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-checked", String(active));
    });
    promptInput.dataset.demoMode = mode;
    promptInput.placeholder = option.placeholder;
    composerModeHint.textContent = option.title;
    composerModeHint.hidden = false;
    setComposerMenuOpen(false);
    promptInput.focus();
    showToast("已切换到" + option.title + "预览模式；不会提交或上传内容。");
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".composer-more-wrap")) setComposerMenuOpen(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setComposerMenuOpen(false);
      appShell.classList.remove("mobile-history-open");
      const mobileButton = document.getElementById("mobileHistoryToggle");
      mobileButton.setAttribute("aria-expanded", "false");
      mobileButton.setAttribute("aria-label", "展开对话历史");
      closeFeedbackDialog();
    }
  });

  // 执行轨迹的每一步属于不同工具，图标应当按工具区分而不是一律打勾。
  // 图标库见 trace-tool-icons.js：同一批语义键登记了多套图标（Remix / Tabler…），
  // 组件页可以切换，选择存在 localStorage 里，这里读同一个键保持一致。
  // 新增一步只要在 HTML 上写 data-tool="xxx"，未收录的取值落回 default；
  // 完成状态另用右下角角标表达，"是什么工具"和"做没做完"互不占用同一个位置。
  const TRACE_TOOL_SETS = window.TRACE_TOOL_SETS || {};
  const TRACE_TOOL_SET_IDS = Object.keys(TRACE_TOOL_SETS);

  function preferredTraceSet() {
    try {
      const saved = window.localStorage.getItem("traceIconSet");
      if (saved && TRACE_TOOL_SETS[saved]) return saved;
    } catch (error) {
      /* 隐私模式或 file:// 下 localStorage 可能直接抛错，忽略即可 */
    }
    if (window.TRACE_TOOL_ACTIVE && TRACE_TOOL_SETS[window.TRACE_TOOL_ACTIVE]) return window.TRACE_TOOL_ACTIVE;
    return TRACE_TOOL_SET_IDS[0];
  }

  const activeTraceSetId = preferredTraceSet();
  const activeTraceSet =
    TRACE_TOOL_SETS[activeTraceSetId] || {
      viewBox: "0 0 24 24",
      style: "stroke",
      icons: window.TRACE_TOOL_ICONS || { default: '<circle cx="12" cy="12" r="10" /><path d="M12 17h.01" />' }
    };
  const TRACE_TOOL_ICONS = activeTraceSet.icons;

  /** 把某个工具解析成 { 值 / 视窗 / 风格 }，单键覆盖（如 chart 借 Tabler）在这一层生效。 */
  function resolveTraceIcon(key) {
    if (typeof window.traceToolIcon === "function") return window.traceToolIcon(key, activeTraceSetId);
    return {
      value: TRACE_TOOL_ICONS[key] || TRACE_TOOL_ICONS.default,
      viewBox: activeTraceSet.viewBox || "0 0 24 24",
      style: activeTraceSet.style || "stroke"
    };
  }

  /** 渲染成节点：优先用图标库导出的节点构造器（轨迹与工具预览页共用一份）。 */
  function traceIconNode(key) {
    if (typeof window.traceToolIconNode === "function") return window.traceToolIconNode(key, activeTraceSetId);
    const entry = resolveTraceIcon(key);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", entry.viewBox);
    if (entry.style) svg.setAttribute("data-style", entry.style);
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = String(entry.value);
    return svg;
  }

  // 标题栏的状态位是工具、图标、粒子三者的汇合处：[粒子][工具图标] 正在检索词典…
  // 它常驻、跨视图可见，用户不看轨迹面板也知道"现在在跑什么"。
  // 两个入口都驱动它：点轨迹某一步（单步预览），或发一个问题（走一遍完整工具链）。
  let headerTimer = 0;
  let headerToken = 0;

  function setHeaderState(tool, doneText) {
    const toolEl = document.getElementById("conversationTool");
    const textEl = document.getElementById("conversationText");
    if (!toolEl || !textEl) return;
    if (!tool) {
      toolEl.hidden = true;
      toolEl.textContent = "";
      textEl.textContent = doneText || "演示已完成";
      return;
    }
    const labels = window.TRACE_TOOL_LABELS || {};
    toolEl.textContent = "";
    toolEl.appendChild(traceIconNode(tool));
    toolEl.hidden = false;
    textEl.textContent = "正在" + (labels[tool] || tool) + "…";
  }

  function dispatchTool(tool) {
    document.dispatchEvent(new CustomEvent("preview:tool", { detail: { tool: tool } }));
  }

  function dispatchDone() {
    document.dispatchEvent(new CustomEvent("preview:orb-state", { detail: { state: "complete" } }));
    document.querySelectorAll(".trace-list li.is-orb-preview").forEach(function (item) {
      item.classList.remove("is-orb-preview");
    });
  }

  /** 单步预览：点轨迹某一步，停 2.6 秒后回到完成态。 */
  function previewTool(tool, step) {
    const token = ++headerToken;
    window.clearTimeout(headerTimer);
    setHeaderState(tool);
    dispatchTool(tool);
    document.querySelectorAll(".trace-list li[data-tool]").forEach(function (item) {
      item.classList.toggle("is-orb-preview", item === step);
    });
    headerTimer = window.setTimeout(function () {
      if (token !== headerToken) return;
      setHeaderState(null);
      dispatchDone();
    }, 2600);
  }

  /** 发送问题后走一遍工具链：图标、粒子、标题栏、状态条一起换，最后落到完成态。 */
  const runStrip = document.getElementById("runStrip");
  const runStripIcon = document.getElementById("runStripIcon");
  const runStripText = document.getElementById("runStripText");
  const runStripTime = document.getElementById("runStripTime");
  const runStripStop = document.getElementById("runStripStop");
  let runStartedAt = 0;
  let runTick = 0;

  function startRunClock() {
    runStartedAt = performance.now();
    if (runStripTime) runStripTime.textContent = "0.0s";
    window.clearInterval(runTick);
    runTick = window.setInterval(function () {
      if (runStripTime) {
        runStripTime.textContent = ((performance.now() - runStartedAt) / 1000).toFixed(1) + "s";
      }
    }, 120);
  }

  function stopRunClock() {
    window.clearInterval(runTick);
    runTick = 0;
  }

  function hideRunStrip() {
    if (runStrip) runStrip.hidden = true;
    stopRunClock();
  }

  function runToolSequence() {
    const sequence = ["model-think", "retrieve-dict", "retrieve-text", "execute-query"];
    const token = ++headerToken;
    window.clearTimeout(headerTimer);
    if (runStrip) runStrip.hidden = false;
    startRunClock();
    let index = 0;

    const step = function () {
      if (token !== headerToken) return;
      if (index >= sequence.length) {
        setHeaderState(null, "已生成回答");
        dispatchDone();
        headerTimer = window.setTimeout(function () {
          if (token === headerToken) hideRunStrip();
        }, 900);
        return;
      }
      const tool = sequence[index];
      index += 1;
      setHeaderState(tool);
      dispatchTool(tool);
      if (runStrip) {
        if (runStripIcon) {
          runStripIcon.textContent = "";
          runStripIcon.appendChild(traceIconNode(tool));
        }
        if (runStripText) {
          runStripText.textContent =
            typeof window.traceToolRunText === "function" ? window.traceToolRunText(tool) : "正在处理…";
        }
      }
      headerTimer = window.setTimeout(step, 1000);
    };

    if (runStripStop) {
      runStripStop.onclick = function () {
        headerToken += 1;
        window.clearTimeout(headerTimer);
        setHeaderState(null, "已停止");
        dispatchDone();
        hideRunStrip();
      };
    }

    step();
  }

  function bindTraceOrbStates() {
    document.querySelectorAll(".trace-list li[data-tool]").forEach(function (step) {
      function preview() {
        previewTool(step.dataset.tool, step);
      }
      step.addEventListener("click", preview);
      step.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          preview();
        }
      });
    });
  }

  document.querySelectorAll(".trace-list li[data-tool]").forEach(function (step) {
    const holder = step.querySelector(".trace-step-icon");
    if (!holder) return;
    if (!holder.firstChild) {
      holder.appendChild(traceIconNode(step.dataset.tool));
    }
    if (step.classList.contains("is-done") && !holder.querySelector(".trace-step-badge")) {
      const badge = document.createElement("span");
      badge.className = "trace-step-badge";
      badge.setAttribute("aria-hidden", "true");
      badge.innerHTML = '<svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-8"/></svg>';
      holder.appendChild(badge);
    }
  });

  bindTraceOrbStates();

  const reduceMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  // 切 tab 后面板没有过渡、内容会"啪"地换掉。这里给刚显示的那一块补一个入场：
  // 透明度 0→1 加 4px 上移，180ms 自然减速。只动 transform / opacity，
  // 不改布局；系统要求减少动效时直接切换。
  function revealPanel(panel) {
    if (!panel || panel.hidden) return;
    if (reduceMotionQuery && reduceMotionQuery.matches) return;
    if (typeof panel.animate !== "function") return;
    panel.animate(
      [
        { opacity: 0, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 180, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
    );
  }

  document.querySelectorAll("[data-primary-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      const target = tab.dataset.primaryTab;
      document.querySelectorAll("[data-primary-tab]").forEach(function (item) {
        const active = item === tab;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      document.querySelectorAll("[data-primary-panel]").forEach(function (panel) {
        if (panel.dataset.primaryPanel !== target) {
          panel.hidden = true;
          return;
        }
        const wasHidden = panel.hidden;
        panel.hidden = false;
        if (wasHidden) revealPanel(panel);
      });
    });
  });

  document.querySelectorAll("[data-result-view]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      const target = tab.dataset.resultView;
      document.querySelectorAll("[data-result-view]").forEach(function (item) {
        const active = item === tab;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      document.querySelectorAll("[data-result-view-panel]").forEach(function (panel) {
        if (panel.dataset.resultViewPanel !== target) {
          panel.hidden = true;
          return;
        }
        const wasHidden = panel.hidden;
        panel.hidden = false;
        if (wasHidden) revealPanel(panel);
      });
    });
  });

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const field = document.createElement("textarea");
        field.value = text;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.left = "-9999px";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        field.remove();
      }
      showToast("已复制演示内容。");
    } catch (error) {
      showToast("复制不可用；演示内容仍可手动选择。");
    }
  }

  document.querySelectorAll("[data-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      copyText(button.dataset.copy || "");
    });
  });

  let activeAnswerReadButton = null;
  let answerUtterance = null;

  function resetAnswerReadButton() {
    if (!activeAnswerReadButton) return;
    activeAnswerReadButton.classList.remove("is-active");
    activeAnswerReadButton.title = "朗读回答";
    activeAnswerReadButton.setAttribute("aria-label", "朗读回答");
    activeAnswerReadButton = null;
    answerUtterance = null;
  }

  document.querySelectorAll("[data-answer-read]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        showToast("当前浏览器没有本地朗读能力。");
        return;
      }
      if (activeAnswerReadButton === button) {
        window.speechSynthesis.cancel();
        resetAnswerReadButton();
        showToast("已停止本地朗读。");
        return;
      }

      window.speechSynthesis.cancel();
      resetAnswerReadButton();
      activeAnswerReadButton = button;
      button.classList.add("is-active");
      button.title = "正在准备朗读，点击停止";
      button.setAttribute("aria-label", "正在准备朗读，点击停止");
      const utterance = new SpeechSynthesisUtterance(button.dataset.answerRead || "");
      answerUtterance = utterance;
      utterance.lang = "zh-CN";
      utterance.onstart = function () {
        if (answerUtterance !== utterance) return;
        button.title = "停止朗读";
        button.setAttribute("aria-label", "停止朗读");
      };
      utterance.onend = function () {
        if (answerUtterance !== utterance) return;
        resetAnswerReadButton();
        showToast("本地朗读已结束。");
      };
      utterance.onerror = function () {
        if (answerUtterance !== utterance) return;
        resetAnswerReadButton();
        showToast("本地朗读未能开始。");
      };
      window.speechSynthesis.speak(utterance);
    });
  });

  document.querySelectorAll("[data-read]").forEach(function (button) {
    button.addEventListener("click", function () {
      const text = button.dataset.read || "";
      if ("speechSynthesis" in window && "SpeechSynthesisUtterance" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        window.speechSynthesis.speak(utterance);
        showToast("正在使用本机语音预览朗读。");
      } else {
        showToast("当前浏览器没有本地朗读能力。");
      }
    });
  });

  document.querySelectorAll("[data-toast]").forEach(function (button) {
    button.addEventListener("click", function () {
      showToast(button.dataset.toast);
    });
  });

  document.querySelector("[data-result-jump]").addEventListener("click", function () {
    const resultsTab = document.querySelector('[data-primary-tab="result"]');
    resultsTab.click();
    document.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "nearest" });
    showToast("已定位到本轮演示结果。");
  });

  const feedbackDialog = document.getElementById("feedbackDialog");
  const feedbackText = document.getElementById("feedbackText");
  const feedbackCounter = document.getElementById("feedbackCounter");
  const feedbackSubmit = document.getElementById("feedbackSubmit");
  const feedbackActionGroup = document.getElementById("feedbackActionGroup");
  const feedbackSubmitted = document.getElementById("feedbackSubmitted");
  const feedbackCategoryLabels = {
    inaccurate: "结果不准确",
    incomplete: "结果不完整",
    misunderstood: "没有理解我的问题",
    format: "格式/展示有问题",
    other: "其他"
  };
  let selectedFeedbackCategory = "";
  let lastFeedbackTrigger = null;

  function updateFeedbackLength() {
    const label = feedbackCategoryLabels[selectedFeedbackCategory];
    const prefix = label ? "【" + label + "】" : "";
    const prefixLength = prefix.length;
    feedbackText.maxLength = Math.max(0, 2000 - prefixLength);
    const composed = prefix + feedbackText.value.trim();
    feedbackCounter.textContent = composed.length + " / 2000";
    feedbackCounter.classList.toggle("is-over", composed.length > 2000);
    feedbackSubmit.disabled = composed.length > 2000;
  }

  function openFeedbackDialog(trigger) {
    selectedFeedbackCategory = "";
    feedbackText.value = "";
    document.querySelectorAll("[data-feedback-category]").forEach(function (button) {
      button.setAttribute("aria-pressed", "false");
    });
    lastFeedbackTrigger = trigger;
    updateFeedbackLength();
    feedbackDialog.hidden = false;
    document.body.classList.add("has-feedback-dialog");
    feedbackText.focus();
  }

  function closeFeedbackDialog(restoreFocus) {
    if (!feedbackDialog || feedbackDialog.hidden) return;
    feedbackDialog.hidden = true;
    document.body.classList.remove("has-feedback-dialog");
    if (restoreFocus !== false && lastFeedbackTrigger) lastFeedbackTrigger.focus();
  }

  document.querySelector("[data-feedback-useful]").addEventListener("click", function () {
    feedbackActionGroup.hidden = true;
    feedbackSubmitted.hidden = false;
    feedbackSubmitted.textContent = "演示：已选「有用」";
    showToast("已记录有用的静态演示状态；未发送到服务器。");
  });

  document.querySelector("[data-feedback-useless]").addEventListener("click", function () {
    openFeedbackDialog(this);
  });

  document.querySelectorAll("[data-feedback-category]").forEach(function (button) {
    button.addEventListener("click", function () {
      const category = button.dataset.feedbackCategory;
      selectedFeedbackCategory = selectedFeedbackCategory === category ? "" : category;
      document.querySelectorAll("[data-feedback-category]").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item.dataset.feedbackCategory === selectedFeedbackCategory));
      });
      updateFeedbackLength();
    });
  });

  feedbackText.addEventListener("input", updateFeedbackLength);
  feedbackSubmit.addEventListener("click", function () {
    feedbackActionGroup.hidden = true;
    feedbackSubmitted.hidden = false;
    feedbackSubmitted.textContent = "演示：已选「无用」";
    closeFeedbackDialog(false);
    showToast("已记录无用的静态演示状态；未发送到服务器或沉淀知识。");
  });
  document.querySelectorAll("[data-feedback-close]").forEach(function (button) {
    button.addEventListener("click", closeFeedbackDialog);
  });
  feedbackDialog.addEventListener("click", function (event) {
    if (event.target === feedbackDialog) closeFeedbackDialog();
  });

  document.getElementById("micButton").addEventListener("click", function () {
    const active = this.classList.toggle("is-recording");
    this.setAttribute("aria-pressed", String(active));
    this.setAttribute("aria-label", active ? "关闭语音输入（演示）" : "开启语音输入（演示）");
    showToast(active ? "语音入口已切换为演示状态，不会访问麦克风。" : "已关闭演示语音状态。");
  });

  document.getElementById("composer").addEventListener("submit", function (event) {
    event.preventDefault();
    if (!promptInput.value.trim()) {
      promptInput.focus();
      showToast("先输入一个问题再试。");
      return;
    }
    showToast("这是静态界面预览，问题没有提交到服务端。");
    // 标题栏的状态位跟着走一遍真实工具链：模型思考 → 检索词典 → 检索文字 → 执行查询。
    runToolSequence();
  });

  promptInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      document.getElementById("composer").requestSubmit();
    }
  });
})();
