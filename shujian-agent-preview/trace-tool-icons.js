/* 轨迹步骤的工具图标库（图标来源：morphicons 站点仓库里的 icon-sets，最终出自 @iconify-json）。
 *
 * 这些 set 是 morphicons 官网用来演示"图标互相形变"的图标源；这里只取图标本身，
 * 不使用它的形变动画。两套并排登记，便于挑选；页面按 TRACE_TOOL_ACTIVE 或
 * localStorage 里的 traceIconSet 决定用哪一套。
 *
 * 许可：Remix Icon（Apache 2.0）、Tabler Icons（MIT）。
 * 用法：轨迹里 <li data-tool="sql">，图标从这里取；未登记的取值落回 default。
 * 换成自己的图标：值可以是内联标记字符串，也可以是 { file: "icons/x.svg" }（遮罩着色）。
 */
(function () {
  var SETS = {
    remix: {
      label: 'Remix Icon',
      license: 'Apache 2.0',
      viewBox: '0 0 24 24',
      style: 'fill',
      icons: {
        context: '<path fill="currentColor" d="M6.455 19L2 22.5V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1zm-.692-2H20V5H4v13.385zM8 10h8v2H8z"/>',
        catalog: '<path fill="currentColor" d="m20.083 15.2l1.202.721a.5.5 0 0 1 0 .858l-8.77 5.262a1 1 0 0 1-1.03 0l-8.77-5.262a.5.5 0 0 1 0-.858l1.202-.721L12 20.05zm0-4.7l1.202.721a.5.5 0 0 1 0 .858L12 17.649l-9.285-5.57a.5.5 0 0 1 0-.858l1.202-.721L12 15.35zm-7.569-9.191l8.771 5.262a.5.5 0 0 1 0 .858L12 12.999L2.715 7.43a.5.5 0 0 1 0-.858l8.77-5.262a1 1 0 0 1 1.03 0M12 3.332L5.887 7L12 10.668L18.113 7z"/>',
        sql: '<path fill="currentColor" d="M11 19V9H4v10zm0-12V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm2-2v14h7V5zM5 16h5v2H5zm9 0h5v2h-5zm0-3h5v2h-5zm0-3h5v2h-5zm-9 3h5v2H5z"/>',
        chart: '<path fill="currentColor" d="M3 12h2v9H3zm16-4h2v13h-2zm-8-6h2v19h-2z"/>',
        'model-think': '<path fill="currentColor" d="M9.973 18H11v-5h2v5h1.027c.132-1.202.745-2.193 1.74-3.277c.113-.122.832-.867.917-.973a6 6 0 1 0-9.37-.002c.086.107.807.853.918.974c.996 1.084 1.609 2.076 1.741 3.278M10 20v1h4v-1zm-4.246-5a8 8 0 1 1 12.49.002C17.624 15.774 16 17 16 18.5V21a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.5C8 17 6.375 15.774 5.754 15"/>',
        'retrieve-dict': '<path fill="currentColor" d="M3 18.5V5a3 3 0 0 1 3-3h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5A3.5 3.5 0 0 1 3 18.5M19 20v-3H6.5a1.5 1.5 0 0 0 0 3zM5 15.337A3.5 3.5 0 0 1 6.5 15H19V4H6a1 1 0 0 0-1 1z"/>',
        'retrieve-text': '<path fill="currentColor" d="m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617m-2.006-.742A6.98 6.98 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.98 6.98 0 0 0 4.875-1.975z"/>',
        'execute-query': '<path fill="currentColor" d="M11 19V9H4v10zm0-12V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm2-2v14h7V5zM5 16h5v2H5zm9 0h5v2h-5zm0-3h5v2h-5zm0-3h5v2h-5zm-9 3h5v2H5z"/>',
        'knowledge-base': '<path fill="currentColor" d="M3 10H2V4.003C2 3.449 2.455 3 2.992 3h18.016A.99.99 0 0 1 22 4.003V10h-1v10.002a.996.996 0 0 1-.993.998H3.993A.996.996 0 0 1 3 20.002zm16 0H5v9h14zM4 5v3h16V5zm5 7h6v2H9z"/>',
        'web-search': '<path fill="currentColor" d="M13 21h5v2H6v-2h5v-1.05a10 10 0 0 1-7.684-4.988l1.737-.992A8 8 0 1 0 15.97 3.053l.993-1.737A10 10 0 0 1 22 10c0 5.185-3.946 9.449-9 9.95zm-1-4a7 7 0 1 1 0-14a7 7 0 0 1 0 14m0-2a5 5 0 1 0 0-10a5 5 0 0 0 0 10"/>',
        'code-run': '<path fill="currentColor" d="m23 12l-7.071 7.071l-1.414-1.414L20.172 12l-5.657-5.657l1.414-1.414zM3.828 12l5.657 5.657l-1.414 1.414L1 12l7.071-7.071l1.414 1.414z"/>',
        'memory-recall': '<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16m1-8h4v2h-6V7h2z"/>',
        search: '<path fill="currentColor" d="m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617m-2.006-.742A6.98 6.98 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.98 6.98 0 0 0 4.875-1.975z"/>',
        web: '<path fill="currentColor" d="M13 21h5v2H6v-2h5v-1.05a10 10 0 0 1-7.684-4.988l1.737-.992A8 8 0 1 0 15.97 3.053l.993-1.737A10 10 0 0 1 22 10c0 5.185-3.946 9.449-9 9.95zm-1-4a7 7 0 1 1 0-14a7 7 0 0 1 0 14m0-2a5 5 0 1 0 0-10a5 5 0 0 0 0 10"/>',
        file: '<path fill="currentColor" d="M9 2.003V2h10.998C20.55 2 21 2.455 21 2.992v18.016a.993.993 0 0 1-.993.992H3.993A1 1 0 0 1 3 20.993V8zM5.83 8H9V4.83zM11 4v5a1 1 0 0 1-1 1H5v10h14V4z"/>',
        sheet: '<path fill="currentColor" d="M21 3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 13H4v6h7zm9 0h-7v6h7zm-9-8H4v6h7zm9 0h-7v6h7z"/>',
        doc: '<path fill="currentColor" d="M7 4V2h10v2h3.007c.548 0 .993.445.993.993v16.014a.994.994 0 0 1-.993.993H3.993A.993.993 0 0 1 3 21.007V4.993C3 4.445 3.445 4 3.993 4zm0 2H5v14h14V6h-2v2H7zm2-2v2h6V4z"/>',
        report: '<path fill="currentColor" d="M9 4L6 2L3 4v15a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-3h-2V4l-3-2l-3 2l-3-2zm10 12H7v3a1 1 0 1 1-2 0V5.07l1-.666l3 2l3-2l3 2l3-2l1 .666zm1 4H8.83c.11-.313.17-.65.17-1v-1h12v1a1 1 0 0 1-1 1"/>',
        pivot: '<path fill="currentColor" d="M5 8h14V5H5zm9 11v-9H5v9zm2 0h3v-9h-3zM4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1"/>',
        compute: '<path fill="currentColor" d="M6 18h12V6H6zm8 2h-4v2H8v-2H5a1 1 0 0 1-1-1v-3H2v-2h2v-4H2V8h2V5a1 1 0 0 1 1-1h3V2h2v2h4V2h2v2h3a1 1 0 0 1 1 1v3h2v2h-2v4h2v2h-2v3a1 1 0 0 1-1 1h-3v2h-2zM8 8h8v8H8z"/>',
        code: '<path fill="currentColor" d="m23 12l-7.071 7.071l-1.414-1.414L20.172 12l-5.657-5.657l1.414-1.414zM3.828 12l5.657 5.657l-1.414 1.414L1 12l7.071-7.071l1.414 1.414z"/>',
        terminal: '<path fill="currentColor" d="m11 12l-7.071 7.071l-1.414-1.414L8.172 12L2.515 6.343L3.929 4.93zm0 7h10v2H11z"/>',
        aggregate: '<path fill="currentColor" d="M8.005 5.003h3v9h-3v3h-2v-3h-3v-9h3v-3h2zm-3 2v5h4v-5zm13 3h3v9h-3v3h-2v-3h-3v-9h3v-3h2zm-3 2v5h4v-5z"/>',
        filter: '<path fill="currentColor" d="M21 4v2h-1l-5 7.5V22H9v-8.5L4 6H3V4zM6.404 6L11 12.894V20h2v-7.106L17.596 6z"/>',
        sort: '<path fill="currentColor" d="m11.95 7.95l-1.414 1.414L8 6.828V20H6V6.828L3.466 9.364L2.05 7.95L7 3zm10 8.1L17 21l-4.95-4.95l1.414-1.414l2.537 2.536L16 4h2v13.172l2.536-2.536z"/>',
        join: '<path fill="currentColor" d="M7.105 15.21A3.001 3.001 0 1 1 5 15.17V8.83a3.001 3.001 0 1 1 2 0V12c.836-.628 1.874-1 3-1h4a3 3 0 0 0 2.895-2.21a3.001 3.001 0 1 1 2.032.064A5 5 0 0 1 14 13h-4a3 3 0 0 0-2.895 2.21M6 17a1 1 0 1 0 0 2a1 1 0 0 0 0-2M6 5a1 1 0 1 0 0 2a1 1 0 0 0 0-2m12 0a1 1 0 1 0 0 2a1 1 0 0 0 0-2"/>',
        calendar: '<path fill="currentColor" d="M9 1v2h6V1h2v2h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1zm11 10H4v8h16zM7 5H4v4h16V5h-3v2h-2V5H9v2H7z"/>',
        clock: '<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16m1-8h4v2h-6V7h2z"/>',
        user: '<path fill="currentColor" d="M4 22a8 8 0 1 1 16 0h-2a6 6 0 0 0-12 0zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6s6 2.685 6 6s-2.685 6-6 6m0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4"/>',
        org: '<path fill="currentColor" d="M21 19h2v2H1v-2h2V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v15h4v-8h-2V9h3a1 1 0 0 1 1 1zM5 5v14h8V5zm2 6h4v2H7zm0-4h4v2H7z"/>',
        location: '<path fill="currentColor" d="m12 20.9l4.95-4.95a7 7 0 1 0-9.9 0zm0 2.828l-6.364-6.364a9 9 0 1 1 12.728 0zM12 13a2 2 0 1 0 0-4a2 2 0 0 0 0 4m0 2a4 4 0 1 1 0-8a4 4 0 0 1 0 8"/>',
        upload: '<path fill="currentColor" d="M3 19h18v2H3zM13 5.828V17h-2V5.828L4.929 11.9l-1.414-1.414L12 2l8.485 8.485l-1.414 1.415z"/>',
        download: '<path fill="currentColor" d="M3 19h18v2H3zm10-5.828L19.071 7.1l1.414 1.414L12 17L3.515 8.515L4.929 7.1L11 13.173V2h2z"/>',
        share: '<path fill="currentColor" d="m13.12 17.023l-4.199-2.29a4 4 0 1 1 0-5.465l4.2-2.29a4 4 0 1 1 .958 1.755l-4.2 2.29a4 4 0 0 1 0 1.954l4.2 2.29a4 4 0 1 1-.959 1.755M6 14a2 2 0 1 0 0-4a2 2 0 0 0 0 4m11-6a2 2 0 1 0 0-4a2 2 0 0 0 0 4m0 12a2 2 0 1 0 0-4a2 2 0 0 0 0 4"/>',
        retry: '<path fill="currentColor" d="M5.463 4.433A9.96 9.96 0 0 1 12 2c5.523 0 10 4.477 10 10c0 2.136-.67 4.116-1.81 5.74L17 12h3A8 8 0 0 0 6.46 6.228zm13.074 15.134A9.96 9.96 0 0 1 12 22C6.477 22 2 17.523 2 12c0-2.136.67-4.116 1.81-5.74L7 12H4a8 8 0 0 0 13.54 5.772z"/>',
        warning: '<path fill="currentColor" d="m12.866 3l9.526 16.5a1 1 0 0 1-.866 1.5H2.474a1 1 0 0 1-.866-1.5L11.134 3a1 1 0 0 1 1.732 0m-8.66 16h15.588L12 5.5zM11 16h2v2h-2zm0-7h2v5h-2z"/>',
        check: '<path fill="currentColor" d="m10 15.17l9.192-9.191l1.414 1.414L10 17.999l-6.364-6.364l1.414-1.414z"/>',
        chip: '<path fill="currentColor" d="M6 18h12V6H6zm8 2h-4v2H8v-2H5a1 1 0 0 1-1-1v-3H2v-2h2v-4H2V8h2V5a1 1 0 0 1 1-1h3V2h2v2h4V2h2v2h3a1 1 0 0 1 1 1v3h2v2h-2v4h2v2h-2v3a1 1 0 0 1-1 1h-3v2h-2zM8 8h8v8H8z"/>',
        sliders: '<path fill="currentColor" d="M6.17 18a3.001 3.001 0 0 1 5.66 0H22v2H11.83a3.001 3.001 0 0 1-5.66 0H2v-2zm6-7a3.001 3.001 0 0 1 5.66 0H22v2h-4.17a3.001 3.001 0 0 1-5.66 0H2v-2zm-6-7a3.001 3.001 0 0 1 5.66 0H22v2H11.83a3.001 3.001 0 0 1-5.66 0H2V4zM9 6a1 1 0 1 0 0-2a1 1 0 0 0 0 2m6 7a1 1 0 1 0 0-2a1 1 0 0 0 0 2m-6 7a1 1 0 1 0 0-2a1 1 0 0 0 0 2"/>',
        default: '<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16m-1-5h2v2h-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1a1.5 1.5 0 1 0-1.471-1.794l-1.962-.393A3.501 3.501 0 1 1 13 13.355"/>'
      }
    },
    tabler: {
      label: 'Tabler Icons',
      license: 'MIT',
      viewBox: '0 0 24 24',
      style: 'stroke',
      icons: {
        context: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m3 20l1.3-3.9C1.976 12.663 2.874 8.228 6.4 5.726c3.526-2.501 8.59-2.296 11.845.48c3.255 2.777 3.695 7.266 1.029 10.501S11.659 20.922 7.7 19z"/>',
        catalog: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01"/>',
        sql: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6a8 3 0 1 0 16 0A8 3 0 1 0 4 6"/><path d="M4 6v6a8 3 0 0 0 16 0V6"/><path d="M4 12v6a8 3 0 0 0 16 0v-6"/></g>',
        chart: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M3 13a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm12-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zM9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zM4 20h14"/>',
        'model-think': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2-2a2 2 0 0 1-2-2a2 2 0 0 1-2 2m0-12a2 2 0 0 1 2 2a2 2 0 0 1 2-2a2 2 0 0 1-2-2a2 2 0 0 1-2 2M9 18a6 6 0 0 1 6-6a6 6 0 0 1-6-6a6 6 0 0 1-6 6a6 6 0 0 1 6 6"/>',
        'retrieve-dict': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0M3 6v13m9-13v13m9-13v13"/>',
        'retrieve-text': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0-14 0m18 11l-6-6"/>',
        'execute-query': '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6a8 3 0 1 0 16 0A8 3 0 1 0 4 6"/><path d="M4 6v6a8 3 0 0 0 16 0V6"/><path d="M4 12v6a8 3 0 0 0 16 0v-6"/></g>',
        'knowledge-base': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2m2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-9 4h4"/>',
        'web-search': '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9a4 4 0 1 0 8 0a4 4 0 0 0-8 0"/><path d="M5.75 15A8.015 8.015 0 1 0 15 2m-4 15v4m-4 0h8"/></g>',
        'code-run': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m7 8l-4 4l4 4m10-8l4 4l-4 4M14 4l-4 16"/>',
        'memory-recall': '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0"/><path d="M12 7v5l3 3"/></g>',
        search: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0-14 0m18 11l-6-6"/>',
        web: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9a4 4 0 1 0 8 0a4 4 0 0 0-8 0"/><path d="M5.75 15A8.015 8.015 0 1 0 15 2m-4 15v4m-4 0h8"/></g>',
        link: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m9 15l6-6m-4-3l.463-.536a5 5 0 0 1 7.071 7.072L18 13m-5 5l-.397.534a5.07 5.07 0 0 1-7.127 0a4.97 4.97 0 0 1 0-7.071L6 11"/>',
        file: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2"/></g>',
        sheet: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zM4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/>',
        doc: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2"/></g>',
        report: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2l-2 2l-2-2l-2 2l-2-2zM9 7h6m-6 4h6m-2 4h2"/>',
        pivot: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm0 9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm10-9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/>',
        compute: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M5 9h14M5 15h14M11 4L7 20M17 4l-4 16"/>',
        code: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m7 8l-4 4l4 4m10-8l4 4l-4 4M14 4l-4 16"/>',
        terminal: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m5 7l5 5l-5 5m7 2h7"/>',
        aggregate: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17l6-6l4 4l8-8"/><path d="M14 7h7v7"/></g>',
        filter: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M4 4h16v2.172a2 2 0 0 1-.586 1.414L15 12v7l-6 2v-8.5L4.52 7.572A2 2 0 0 1 4 6.227z"/>',
        sort: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M7 3v18m3-15L7 3L4 6m16 12l-3 3l-3-3m3 3V3"/>',
        join: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0m10 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M7 8v8m2 2h6a2 2 0 0 0 2-2v-5"/><path d="m14 14l3-3l3 3"/></g>',
        calendar: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm12-4v4M8 3v4m-4 4h16m-9 4h1m0 0v3"/>',
        clock: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0"/><path d="M12 7v5l3 3"/></g>',
        user: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>',
        org: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M9 8h1m-1 4h1m-1 4h1m4-8h1m-1 4h1m-1 4h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>',
        location: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0"/><path d="M17.657 16.657L13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0"/></g>',
        upload: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 9l5-5l5 5m-5-5v12"/>',
        download: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5l5-5m-5-7v12"/>',
        share: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M3 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0m12-6a3 3 0 1 0 6 0a3 3 0 1 0-6 0m0 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0m-6.3-7.3l6.6-3.4m-6.6 6l6.6 3.4"/>',
        retry: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4m-4 4a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/>',
        warning: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m-1.637-9.409L2.257 17.125a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636-2.87L13.637 3.59a1.914 1.914 0 0 0-3.274 0M12 16h.01"/>',
        check: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m5 12l5 5L20 7"/>',
        chip: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M9 9h6v6H9zm-6 1h2m-2 4h2m5-11v2m4-2v2m7 5h-2m2 4h-2m-5 7v-2m-4 2v-2"/></g>',
        sliders: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M12 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0M4 6h8m4 0h4M6 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0m-2 0h2m4 0h10m-5 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0M4 18h11m4 0h1"/>',
        default: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0m9 5v.01"/><path d="M12 13.5a1.5 1.5 0 0 1 1-1.5a2.6 2.6 0 1 0-3-4"/></g>'
      }
    }
  }

  var LABELS = {
    context: '对话上下文',
    catalog: '指标目录',
    sql: '数据库查询',
    chart: '图表',
    'model-think': '模型思考',
    'retrieve-dict': '检索词典',
    'retrieve-text': '检索文字',
    'execute-query': '执行查询',
    'knowledge-base': '调用知识库',
    'web-search': '联网检索',
    'code-run': '执行代码',
    'memory-recall': '记忆召回',
    search: '检索',
    web: '联网',
    link: '引用来源',
    file: '文件',
    sheet: '表格',
    doc: '文档',
    report: '报告',
    pivot: '透视',
    compute: '计算',
    code: '代码',
    terminal: '命令',
    aggregate: '汇总',
    filter: '筛选',
    sort: '排序',
    join: '关联',
    calendar: '时间范围',
    clock: '耗时',
    user: '用户',
    org: '企业',
    location: '地区',
    upload: '上传',
    download: '导出',
    share: '分享',
    retry: '重试',
    warning: '告警',
    check: '校验',
    chip: '计算资源',
    sliders: '参数',
    default: '兜底（未知工具）'
  }

  var USED = ['model-think', 'retrieve-dict', 'retrieve-text', 'execute-query']

  /* 单键覆盖：个别工具可以从另一套借同名图标。
     现在默认整套用 Tabler（描边，和页面其它图标同一套线条语言），所以没有例外；
     机制保留，将来某一档不满意时加一行即可。 */
  var OVERRIDES = {}

  /* 工具 → 粒子状态。粒子不是装饰，它描述"当前在做什么"，所以映射按动作的性质来定：
       - 模型思考 → weaving，对外显示为 planning（见 ORB_LABELS）
         官方站点就是把 weaving 这一档写作 planning：双股交错 = 把线索编成计划。
       - 检索词典 → searching（globe 带扫描压暗，最像在字典里逐条扫）
       - 检索文字 → working（多条轨道同时绕转 = 并行捞回多段文本）
       - 执行查询 → solving（立方体面依次转动 = 确定性的逐步计算，不是探索）
       - 调用知识库 → connecting（节点与连线 = 连到外部知识源再取回）
       - 联网检索 → searching（与检索同源的扫描语义）
       - 执行代码 → solving（同属确定性执行）
       - 记忆召回 → breathing（安静的低速呼吸 = 低强度的回想，不抢注意力）
     注意：引擎的 shaping（形变）我们不用，所以没有任何工具指向它。
     新增工具时补一行即可，轨迹那边不用再写 data-orb。 */
  var ORB = {
    'model-think': 'weaving',
    'retrieve-dict': 'searching',
    'retrieve-text': 'working',
    'execute-query': 'solving',
    'knowledge-base': 'connecting',
    'web-search': 'searching',
    'code-run': 'solving',
    'memory-recall': 'breathing'
  }

  /* 引擎状态 → 对外显示名。官方站点把 weaving 这档显示为 planning，
     我们沿用同一套叫法，免得文档和界面对不上。 */
  var ORB_LABELS = { weaving: 'planning' }

  /* 运行时的动作短语。工具名是"用什么"，这里写的是"在做什么"——
     等待时给用户的是进展，不是状态码。 */
  var RUN_TEXT = {
    'model-think': '正在拆解问题，确定比较口径',
    'retrieve-dict': '正在匹配指标口径',
    'retrieve-text': '正在检索口径说明与历史分析',
    'execute-query': '正在执行只读查询',
    'knowledge-base': '正在调用知识库',
    'web-search': '正在联网检索',
    'code-run': '正在执行代码',
    'memory-recall': '正在回忆相关上下文'
  }

  /** 某个工具的运行短语；未登记的回落为"正在<工具名>"。 */
  window.traceToolRunText = function (key) {
    return RUN_TEXT[key] || ('正在' + (LABELS[key] || key))
  }

  /** 某个工具对应的粒子状态；未登记的回落到 working。 */
  window.traceToolOrb = function (key) {
    return ORB[key] || 'working'
  }

  /** 粒子状态的显示名（引擎内部名 → 对外叫法）。 */
  window.traceToolOrbLabel = function (state) {
    return ORB_LABELS[state] || state
  }

  /** 解析某个工具当前应当用的图标：优先单键覆盖，其次当前集，最后 default。 */
  window.traceToolIcon = function (key, setId) {
    var override = OVERRIDES[key]
    var set = (override && SETS[override]) || SETS[setId] || SETS[window.TRACE_TOOL_ACTIVE]
    var source = override && SETS[override] ? override : (SETS[setId] ? setId : window.TRACE_TOOL_ACTIVE)
    var chosen = set.icons[key] || set.icons.default
    return {
      key: key,
      value: chosen,
      viewBox: set.viewBox || '0 0 24 24',
      style: set.style || 'stroke',
      from: source
    }
  }

  /** 直接产出可插入 DOM 的图标节点，轨迹面板与工具预览页共用这一份。 */
  window.traceToolIconNode = function (key, setId) {
    var entry = window.traceToolIcon(key, setId)
    if (entry.value && typeof entry.value === 'object' && entry.value.file) {
      var mask = document.createElement('span')
      mask.className = 'icon-mask'
      mask.style.setProperty('--icon-src', 'url("' + entry.value.file + '")')
      return mask
    }
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', entry.viewBox)
    if (entry.style) svg.setAttribute('data-style', entry.style)
    svg.setAttribute('aria-hidden', 'true')
    svg.innerHTML = String(entry.value)
    return svg
  }

  window.TRACE_TOOL_SETS = SETS
  window.TRACE_TOOL_ACTIVE = 'tabler'
  window.TRACE_TOOL_LABELS = LABELS
  window.TRACE_TOOL_USED = USED
  window.TRACE_TOOL_OVERRIDES = OVERRIDES
  window.TRACE_TOOL_ORB = ORB
  window.TRACE_TOOL_ORB_LABELS = ORB_LABELS
  window.TRACE_TOOL_RUN_TEXT = RUN_TEXT
  window.TRACE_TOOL_ICONS = SETS[window.TRACE_TOOL_ACTIVE].icons
})()
