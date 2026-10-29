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

  document.querySelectorAll("[data-primary-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      const target = tab.dataset.primaryTab;
      document.querySelectorAll("[data-primary-tab]").forEach(function (item) {
        const active = item === tab;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      document.querySelectorAll("[data-primary-panel]").forEach(function (panel) {
        panel.hidden = panel.dataset.primaryPanel !== target;
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
        panel.hidden = panel.dataset.resultViewPanel !== target;
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
  });

  promptInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      document.getElementById("composer").requestSubmit();
    }
  });
})();
