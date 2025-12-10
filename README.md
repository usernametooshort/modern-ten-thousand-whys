# 十万个为什么 3D · Portal

这是一个部署在 Synology NAS / Web Station 上的纯静态站点，用于汇总多个沉浸式科学可视化体验。目前已上线的章节与体验：

- `index.html`：门户首页，展示章节目录与愿景。
- `astronomy/index.html`：天文篇章节页，链接至各体验。
- `solar-system/`：Three.js 版太阳系运动模型。
- `star-life/`：恒星生命周期可视化，覆盖星云 → 超新星的阶段切换。
- `earth-atmosphere/`：全球环流 Beta 版，展示大气三圈模型与风带分布。
- `elasticity/`：弹性棒震动 Beta 版，演示弹性系数、阻尼对振幅与频率的影响。

> 最新内容  
> - 太阳系体验 v1.1：引入星云穹顶、小行星带与电影级行星材质，扩展行星数据面板。  
> - 恒星生命周期 v1.0：单场景内切换星云、原恒星、主序星、红巨星、超新星与中子星，伴随粒子喷流和冲击波特效。  
> - 全球环流体验 Beta：模拟哈德莱/费雷尔/极地三圈环流，使用粒子流线与风带标注呈现热力交换。  
> - 弹性棒震动 Beta：可拖拽虚拟弹性棒并实时查看振幅、频率折线，帮助理解震动参数。

## 目录结构

```
modern-ten-thousand-whys-3d/
├── index.html                # 门户入口
├── assets/
│   ├── css/main.css          # 全站视觉
│   └── js/main.js            # 星光背景 & 交互
├── libs/
│   └── three/                # Three.js 本地依赖（build + examples/jsm）
├── astronomy/
│   └── index.html            # 天文篇目录
├── solar-system/             # 体验：太阳系运动模型
│   ├── index.html
│   ├── css/style.css
│   ├── js/main.js
│   └── README.md
├── star-life/                # 体验：恒星生命周期
│   ├── index.html
│   ├── css/style.css
│   ├── js/main.js
│   └── README.md
├── earth-atmosphere/         # 体验：全球环流（Beta）
│   ├── index.html
│   ├── css/style.css
│   └── js/main.js
└── elasticity/               # 体验：弹性棒震动（Beta）
    ├── index.html
    ├── css/style.css
    └── js/main.js
```

## 在 Web Station 中无法访问？请逐项检查

1. **目录映射**  
   - 在 Web Station > 虚拟主机中，创建/编辑站点，将“文档根目录”指向本项目根目录（`/volume1/web/modern-ten-thousand-whys-3d`）。
   - 确保 `index.html` 就在该根目录下。

2. **权限**  
   - 使用 File Station 或 SSH 执行 `chmod u+w /volume1/web/modern-ten-thousand-whys-3d`，保证当前用户可写。
   - 站点对外只需“读取”即可，内部维护时再开放写权限。

3. **访问方式**  
   - 必须通过 `http(s)://NAS_IP/modern-ten-thousand-whys-3d/` 访问。  
   - 由于 `solar-system` 使用 ES Modules，**不要**直接使用 `file://` 打开。

4. **Three.js 依赖**  
   - 所有 3D 体验统一使用本地 `libs/three/` 目录，不依赖外部 CDN。部署时需确保 `libs/` 目录也一并复制到 Web Station。

## 本地调试

```bash
cd modern-ten-thousand-whys-3d
python3 -m http.server 4173
```

随后访问 `http://localhost:4173/`。

## 下一步迭代建议

1. 为地理篇、物理篇补充示例可视化并填充卡片链接。
2. 为每个体验补充多语言说明与使用指南。
3. 使用 Service Worker 缓存共享资源，提升离线体验。

