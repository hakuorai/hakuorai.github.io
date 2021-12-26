// 创建拖动工具
function createGrabTool()
{
    function onDragStart(event)
    {
        this.cursor = 'grabbing';
        this.lastX = event.data.global.x;
        this.lastY = event.data.global.y;
        this.dragging = true;
    }
    
    function onDragging(event)
    {
        if (!this.dragging) return;

        let pos = event.data.global;
        this.x += pos.x - this.lastX;
        this.y += pos.y - this.lastY;
        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    function onDragEnd()
    {
        this.cursor = 'grab';
        this.dragging = false;
        this.updateArea(window.innerWidth, window.innerHeight);
    }
    
    return new ToolbarItem(
        'Grab', 
        'icons/grabtool.png',
        function (_canvas) {
            _canvas.cursor = 'grab';
            _canvas.removeAllListeners();
            _canvas
                .on('pointerdown', onDragStart)
                .on('pointerup', onDragEnd)
                .on('pointerupoutside', onDragEnd)
                .on('pointermove', onDragging);
        }
    );
}

// 创建直线工具
function createLineTool()
{    
    return new ToolbarItem(
        'Line', 
        'icons/linetool.png',
        function (_canvas) {
            _canvas.cursor = 'crosshair';
            _canvas.removeAllListeners();
            _canvas.on('pointerdown', (event) => {
                var pos = event.data.global;
                _canvas.clickPos = relativePos(pos, _canvas);
                _canvas.clicking = true;
            });
            _canvas.on('pointerup', (event) => {
                if (!_canvas.clicking) return;
                
                var pos = relativePos(event.data.global, _canvas);
                drawLine(_canvas, 
                _canvas.clickPos,
                pos);
                _canvas.clicking = false;
            });
        }
    );
}

// 创建画圆工具
function createCircleTool()
{   
    function onDragStart(event)
    {
        var pos = event.data.global;
        this.clickPos = relativePos(pos, this);
        this.clicking = true;
    }

    function onDragging(event)
    {
        
    }

    function onDragEnd(event)
    {
        var pos = relativePos(event.data.global, this);
        var R = pointDist(pos, this.clickPos);
        drawCircle(
            this, 
            this.clickPos,
            Math.floor(R)
        );
        this.clicking = false;
    }

    return new ToolbarItem(
        'Circle',
        'icons/circletool.png',
        function (_canvas) {
            _canvas.cursor = 'crosshair';
            _canvas.removeAllListeners();
            _canvas
                .on('pointerdown', onDragStart)
                .on('pointerup', onDragEnd)
                .on('pointerupoutside', onDragEnd)
                .on('pointermove', onDragging);
        }
    );
}

// 创建椭圆工具
function createEllipseTool()
{
    function onDragStart(event)
    {
        var pos = event.data.global;
        this.clickPos = relativePos(pos, this);
        this.clicking = true;
    }

    function onMove(event)
    {
        
    }

    function onDragEnd(event)
    {
        var pos = relativePos(event.data.global, this);
        drawEllipse(
            this,
            Math.floor(Math.abs(pos.x - this.clickPos.x)),
            Math.floor(Math.abs(pos.y - this.clickPos.y)),
            this.clickPos
        )
        this.clicking = false;
    }
    
    return new ToolbarItem(
        'Ellipse',
        'icons/ellipsetool.png',
        function (_canvas) {
            _canvas.cursor = 'crosshair';
            _canvas.removeAllListeners();
            _canvas
                .on('pointerdown', onDragStart)
                .on('pointerup', onDragEnd)
                .on('pointerupoutside', onDragEnd)
                .on('pointermove', onMove);
        }
    );
}

// 创建多边形工具
function createPolygonTool()
{
    function hintPoint(_canvas, tool, pos) // 显示提示起点
    {        
        const pHint = new PIXI.Graphics();
        pHint.beginFill(0xFFA500, 0.5);
        pHint.drawCircle(0, 0, 5);
        pHint.endFill();
        pHint.position.set(pos.x, pos.y);
        _canvas.addChild(pHint);

        tool.hintPointObj = pHint; // 闭合后，要销毁这个物体
    }
    
    function onClick(event)
    {   
        var tool = sidebar.Polygon;
        
        var pos = relativePos(event.data.global, this);
        tool.pointList.push(pos);
        var pointCnt = tool.pointList.length;
        if (pointCnt == 1) return;
        var beginPos = tool.pointList[0];
        var lastPos = tool.pointList[pointCnt-2];

        var closed = false;
        
        // 起点标记处理
        if (pointCnt == 3)
        {
            hintPoint(this, tool, beginPos);
        }
        else if (pointCnt>3 && pointDist(pos, beginPos)<=5) // 闭合并结束绘图
        {
            let hintObj = tool.hintPointObj;
            pos.x = hintObj.x;
            pos.y = hintObj.y;
            tool.hintPointObj.destroy();
            tool.hintPointObj = null;
            closed = true;
        }

        drawLine(this, lastPos, pos);

        // 闭合后处理
        if (closed)
        {
            fenceFill(this, tool.pointList, beginPos.x);
            console.log("Polyfill successed!");
            tool.pointList = [];
        }
    }

    var polytool = new ToolbarItem(
        'Polygon',
        'icons/polytool.png',
        function (_canvas) {
            _canvas.cursor = 'crosshair';
            _canvas.removeAllListeners();
            
            _canvas
                .on('pointerdown', onClick);

            this.pointList = [];
        }
    );

    return polytool;
}

// 创建对正方形、正六边形和五角星进行变换的工具
function createPolyTransformTool()
{
    const nodeR = 5;

    // 绘制控制节点
    function drawNode(parent, name, narr, nid, color, moveHandler)
    {
        var tool = sidebar.Polytrans;
        var node = tool.nodes[name];
        if (node != null)
            node.destroy();
        
        node = new PIXI.Graphics();
        node.beginFill(color);
        node.drawCircle(0, 0, nodeR);
        node.endFill();
        
        var pos = narr[nid];
        node.position.set(pos.x, pos.y);
        parent.addChild(node);
        tool.nodes[name] = node;
        node.name = name;
        node.nid = nid;
        node.moveHandler = moveHandler;
    }
    
    /* 控制节点响应函数，接管move事件，创建变换矩阵 */
    // 移动锚点
    function pivotMove(tool, clkpos, curpos)
    {
        var poly = tool.poly;
        poly.narr[0] = curpos;
        var pivothint = tool.nodes.pivot;
        pivothint.position.set(curpos.x, curpos.y);
        tool.transpivot = curpos;
        return true;
    }
    
    // 平移
    function translation(tool, clkpos, curpos)
    {
        var delta = relativePos(curpos, clkpos);
        var mat = new CGMat(
            1, 0, 0,
            0, 1, 0,
            delta.x, delta.y, 1
        );
        tool.transmat = mat;
    }
    
    // x错切
    function xshearing(tool, clkpos, curpos)
    {
        const step = 100;
        var delta = relativePos(curpos, clkpos);
        var mat = new CGMat(
            1, 0, 0,
            -delta.x/step, 1, 0
        );
        tool.transmat = mat;
    }

    // y错切
    function yshearing(tool, clkpos, curpos)
    {
        const step = 100;
        var delta = relativePos(curpos, clkpos);
        var mat = new CGMat(
            1, delta.y/step, 0,
            0, 1, 0
        );
        tool.transmat = mat;
    }

    // 缩放
    function scaling(tool, clkpos, curpos)
    {
        const step = 100; // 每step像素放大至2倍
        var delta = relativePos(curpos, clkpos);
        var mat = new CGMat(
            1+delta.x/step, 0, 0,
            0, 1-delta.y/step, 0
        );
        tool.transmat = mat;
    }

    // 旋转
    function rotating(tool, clkpos, curpos)
    {
        const theta = getAngle(clkpos, tool.transpivot);
        const delta = getAngle(curpos, tool.transpivot) - theta;
        var mat = new CGMat(
            Math.cos(delta), Math.sin(delta), 0,
            -Math.sin(delta), Math.cos(delta), 0
        );
        tool.transmat = mat;
    }

    function onClick(event)
    {
        var tool = sidebar.Polytrans;
        var clkpos = relativePos(event.data.global, this);
        tool.clkpos = clkpos;
        if (tool.state == 1)
        {
            // 判断是否点击了节点，是则使用当前节点
            let touched = false;
            for (let i in tool.nodes)
            {
                let node = tool.nodes[i];
                if (pointDist(clkpos, node) < nodeR)
                {
                    tool.currentNode = node;
                    touched = true;
                    break;
                }
            }
            if (!touched) // 否则进入平移模式
            {
                tool.currentNode = {
                    "moveHandler": translation
                };
            }
            
        }

        tool.pointerdown = true;
    }

    function onMove(event)
    {
        var pos = relativePos(event.data.global, this);
        
        var tool = sidebar.Polytrans;
        if (!tool.pointerdown) return;
        if (tool.state == 0) // 拖动决定半径
        {   
            
        }
        else if (tool.state == 1 && tool.currentNode != null)
        {
            if(tool.currentNode.moveHandler(tool, tool.clkpos, pos))
                return;

            // 重绘多边形
            let graph = tool.graph;
            graph.clear();
            let shape = tool.poly;
            shape.applyTransform(tool.transmat, tool.transpivot);
            shape.drawTo(graph, this.brushColor);

            // 重设控制节点位置
            for (let i in tool.nodes)
            {
                let nid = tool.nodes[i].nid;
                let pos = shape.narr[nid];
                tool.nodes[i].position.set(pos.x, pos.y);
            }
            
        }
    }

    function onRelease(event)
    {
        var tool = sidebar.Polytrans;
        tool.pointerdown = false;
        if (tool.state == 0)
        {
            // 创建形状
            let pos = relativePos(event.data.global, this);
            var polyshape;
            
            if (tool.shapesel == 0) // 正方形
            {
                const width = Math.abs(tool.clkpos.x - pos.x);
                const height = Math.abs(tool.clkpos.y - pos.y);
                const sidelen = Math.min(width, height);
                const p0 = new Point(
                    Math.min(tool.clkpos.x, pos.x),
                    Math.max(tool.clkpos.y, pos.y)
                ); // 取左下角
                polyshape = CGSquare(p0, sidelen);
                
            }
            else if (tool.shapesel == 1) // 五角星
            {
                const R = pointDist(pos, tool.clkpos);
                polyshape = CGStar(pos, R);
            }
            else if (tool.shapesel == 2) // 六边形
            {
                const R = pointDist(pos, tool.clkpos);
                polyshape = CGHexagon(pos, R);
            }
            tool.poly = polyshape;

            // 将形状画出
            let graph = new PIXI.Graphics();
            polyshape.drawTo(graph, this.brushColor);
            
            this.addChild(graph);
            tool.graph = graph;

            // 绘制操纵点
            drawNode(this, 'pivot', polyshape.narr, 0, 0xDC143C, pivotMove); // 锚点
            drawNode(this, 'xshear', polyshape.narr, 3, 0x7FFFAA, xshearing); // x错切
            drawNode(this, 'scale', polyshape.narr, 4, 0xFFA07A, scaling); // 缩放
            drawNode(this, 'yshear', polyshape.narr, 5, 0x7FFFAA, yshearing); // y错切
            drawNode(this, 'rotate', polyshape.narr, 6, 0xF0FFFF, rotating); // 旋转

            tool.transpivot = polyshape.narr[0];

            // 变换矩阵
            tool.transmat = new CGMat(
                1, 0, 0, 
                0, 1, 0,
                0, 0, 1
            );

            tool.state = 1; // 进入变换模式
            tool.icon.texture = tool.loadedres["plt_ok"];
        }
        else if (tool.state == 1)
        {
            // 提交一次矩阵修改
            tool.poly.applyMod();
        }
    }
    
    return new ToolbarItem(
        'Polytrans',
        'icons/transtool.png',
        function (_canvas) {
            if (sidebar.currentTool == this && this.state == 0)
            {
                this.shapesel++;
                this.shapesel = this.shapesel % 3;
                // 切换图形
                var shapelist = ["plt_square", "plt_star", "plt_hexagon"];
                this.icon.texture = this.loadedres[shapelist[this.shapesel]];
            }
            else
            {
                if (this.state == 1) // 是点击了确认
                {
                    this.state = 0;
                    for (let j in this.nodes)
                    {
                        this.nodes[j].destroy();
                    }
                    this.nodes = {};
                    this.icon.texture = this.loadedres["plt_default"];
                    _canvas.removeAllListeners();
                    _canvas.cursor = '';
                    sidebar.currentTool = null;
                    return;
                }
                this.state = 0; // 0: 绘制 1：变换
                this.nodes = {};
                
                this.icon.texture = this.loadedres["plt_square"];

                this.shapesel = 0;

                _canvas.cursor = 'crosshair';
            
                _canvas.removeAllListeners();
                _canvas.on('pointerdown', onClick)
                       .on('pointermove', onMove)
                       .on('pointerup', onRelease);
            }
        },
        {
            "plt_default": "icons/transpoly/default.png",
            "plt_square": "icons/transpoly/square.png",
            "plt_star": "icons/transpoly/star.png",
            "plt_hexagon": "icons/transpoly/hexagon.png",
            "plt_ok": "icons/transpoly/ok.png"
        }
    );
}

/* 非交互工具 */

// 修改笔刷颜色工具
function createBrushColorTool()
{
    return new ToolbarItem(
        'BrushColor',
        'icons/brushcolor.png',
        function (_canvas) {
            const color = Math.floor(0xFFFFFF * Math.random());
            _canvas.brushColor = color;
            this.icon.tint = color;
            console.log("Brush color changed to 0x" + color.toString(16));
        }
    );
}

// 清屏
function createClsTool()
{
    return new ToolbarItem(
        'ClearScreen',
        'icons/clstool.png',
        function (_canvas) {
            var p = [];
            for (let i in _canvas.children)
                p.push(_canvas.children[i]);
            for (let i in p)
                p[i].destroy();
        }
    );
}