# 恒星生命周期 (Stellar Lifecycle)

Three.js / WebGL 场景，演示恒星从星云坍缩、原恒星到主序、红巨星、超新星以及中子星残骸的演化轨迹。所有阶段共享同一 3D 场景，实时切换材质、粒子与光效。

## 亮点功能

- **阶段切换时间线**：点击「星云坍缩 → 原恒星 → 主序星 → 红巨星 → 超新星 → 中子星」即可切换不同能量状态，亦可启用自动演化模式。
- **电影级视觉**：使用 ACES Filmic 色调映射、程序化星云穹顶、粒子喷流与冲击波环，打造深空氛围。
- **数据面板**：每个阶段展示中文描述、温度标签以及 4 组关键事实（燃料、结构、能量等）。

## 目录

```
star-life/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
└── （依赖）../libs/three/
```

## 部署与访问

1. 确保 `star-life/` 和 `libs/three/` 与其余站点文件位于同一根目录（例如 `/volume1/web/modern-ten-thousand-whys-3d/`）。
2. 通过 Synology Web Station 指向该根目录后，可在浏览器访问  
   `http://NAS_IP/modern-ten-thousand-whys-3d/star-life/index.html`
3. 本地调试：在项目根目录执行 `python3 -m http.server 4173`，然后访问 `http://localhost:4173/star-life/`。

## 下一步建议

- 增加质量滑块以切换不同质量恒星的分岔路径（如白矮星 vs. 黑洞）。
- 使用音频合成模拟太阳风 / 超新星爆炸的声景，进一步增强沉浸感。


