# 太阳系运动模型 (Solar System Motion Model)

这是一个基于 WebGL (Three.js) 的沉浸式太阳系可视化项目。

## 功能特点
- **3D 交互场景**：自由旋转、缩放视角。
- **动态模拟**：模拟八大行星的公转运动，速度比例基于真实天文数据调整（为了视觉效果，距离和大小非线性缩放）。
- **电影级材质与光照**：每颗行星都带有程序化纹理/法线、大气辉光与多源灯光，太阳具备动态日冕，远景星空有闪烁效果。
- **星云与小行星带**：程序化星云穹顶、星尘粒子与动态小行星带共同营造层次分明的宇宙背景。
- **信息展示**：点击行星可展开包含描述与重点参数的卡片。
- **控制面板**：支持暂停、调节演化速度、显示/隐藏轨道。

## 部署说明 (Synology NAS)

1. **准备文件**：
   确保你拥有完整的 `solar-system` 文件夹，结构如下：
   ```
   solar-system/
   ├── index.html
   ├── css/
   │   └── style.css
   ├── js/
   │   └── main.js
   └── （依赖）../libs/three/  # Three.js 本地模块
   ```

2. **上传到 NAS**：
   - 打开 Synology File Station。
   - 将 `solar-system` 文件夹上传到你的 Web Station 根目录（通常是 `web` 文件夹）。

3. **确保依赖在位**：
   - `libs/three/` 目录包含 `three.module.js` 与 `examples/jsm`，需与项目根目录同级部署（即 `../libs/three/`）。
   - 如需升级 Three.js，可替换该目录下的文件。

4. **访问**：
   - 假设你的 NAS IP 是 `192.168.1.100`，且 Web Station 已启用。
   - 在浏览器访问：`http://192.168.1.100/solar-system/index.html`

## 本地预览
如果你安装了 Python，可以在该目录下运行：
```bash
python3 -m http.server
```
然后访问 `http://localhost:8000`。


