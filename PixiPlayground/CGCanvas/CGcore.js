// 整数点类
function Point(x, y)
{
    this.x = parseInt(x);
    this.y = parseInt(y);
    this.clone = function (){ // 拷贝
        return new Point(this.x, this.y);
    };
}

// 得到相对坐标（p1-p2）
function relativePos(p1, p2)
{
    return new Point(p1.x-p2.x, p1.y-p2.y);
}

function pointDist(p1, p2)
{
    return Math.sqrt(Math.pow(p1.x-p2.x, 2)+Math.pow(p1.y-p2.y, 2));
}

function swapPoint(p1, p2)
{
    var tmp = p1.x;
    p1.x = p2.x;
    p2.x = tmp;
    tmp = p1.y;
    p1.y = p2.y;
    p2.y = tmp;
}

// Draw single-pixel point
function drawPoint(parent, point)
{
    var dot = new PIXI.Graphics();
    dot.beginFill(parent.brushColor);
    dot.drawRect(point.x, point.y, 1, 1);
    dot.endFill();
    parent.addChild(dot);
}

// Draw points in array
function drawShape(parent, points)
{
    var shape = new PIXI.Graphics();
    shape.beginFill(parent.brushColor);
    for (var i=0; i<points.length; i++)
    {
        shape.drawRect(points[i].x, points[i].y, 1, 1);
    }
    shape.endFill();
    parent.addChild(shape);
    return shape;
}

function drawShapeToGraph(graph, points, color)
{
    graph.beginFill(color);
    for (var i=0; i<points.length; i++)
    {
        graph.drawRect(points[i].x, points[i].y, 1, 1);
    }
    graph.endFill();
}

// Draw line in Bresenham
function getLine(_p1, _p2)
{
    var p1 = _p1.clone();
    var p2 = _p2.clone();
    if (p1.x > p2.x) swapPoint(p1, p2); // 保证dx >= 0
    var x, y, dx, dy, p, y2;
    var flip = false;
    var dire = 1;
    x = p1.x;
    y = p1.y;
    y2 = p2.y;
    dx = p2.x - p1.x;
    dy = p2.y - p1.y;
    if (dy < 0) // dy小于0则绘制点需要关于 y=y1 翻转
    {
        flip = true;
        dire = -1;
        dy *= -1;
        y2 += 2*dy;
    }

    var line = new Array();
    if (dx >= dy) // 斜率小于1
    {
        p = dy*2 - dx;
        for(; x<=p2.x; x++)
        {
            line.push(new Point(x, y));
            
            if (p >= 0)
            {
                y += dire;
                p += 2*(dy-dx);
            }
            else p += 2*dy;
        }
    }
    else // 斜率大于1
    {
        p = dx*2 - dy;
        for(; y<=y2; y++)
        {
            if (flip)
                line.push(new Point(x, 2*p1.y - y)); // 关于y=y1翻转
            else line.push(new Point(x, y));
            
            if (p >= 0)
            {
                x++;
                p += 2*(dx-dy);
            }
            else p += 2*dx;
        }
    }

    return line;
}

function drawLine(parent, p1, p2)
{
    return drawShape(parent, getLine(p1, p2));
}

// 求关于原点8对称的点
function get8sym(pos)
{
    const x = pos.x, y = pos.y;
    var points = [pos, new Point(y, x),
    new Point(-x, y), new Point(y, -x),
    new Point(x, -y), new Point(-y, x),
    new Point(-x, -y), new Point(-y, -x)];
    return points;
}

// 求关于原点4对称的点
function get4sym(pos)
{
    const x = pos.x, y = pos.y;
    var points = [pos, new Point(-x, y),
    new Point(-x, -y), new Point(x, -y)];
    return points;
}

// Draw circle in Bresenham
function drawCircle(parent, center, R)
{
    var circle = []; // 围绕原点画圆的点集
    var x=0, y=R, p;
    p=3-2*R;
    for(; x<=y; x++)
    {
        circle = circle.concat(get8sym(new Point(x, y)));
        if (p>=0)
        {
            p+=4*(x-y)+10;
            y--;
        }
        else
        {
            p+=4*x+6;
        }
    }

    // checkGap(circle, R);

    for (let i=0; i<circle.length; i++) // 将圆心移至给定点
    {
        circle[i].x += center.x;
        circle[i].y += center.y;
    }

    drawShape(parent, circle);
}

// 检查缺口
function checkGap(arr, R)
{
    var ax = {}, ay = {};
    for (let i=0; i<arr.length; i++)
    {
        ax[arr[i].x] = 1;
        ay[arr[i].y] = 1;
    }
    for (let x=0; x<=R; x++)
    {
        if (ax[x]==undefined)
            console.log('Gap at x=' + x);
        if (ax[-x]==undefined)
            console.log('Gap at x=' + -x);
    }
    for (let y=0; y<=R; y++)
    {
        if (ay[y]==undefined)
            console.log('Gap at y=' + y);
        if (ay[-y]==undefined)
            console.log('Gap at y=' + -y);    
    }
}

//Draw ellipse in Bresenham
function drawEllipse(parent, a, b, center)
{
    var ellipse = [];
    
    var aa = a*a, bb = b*b;
    var x = 0, y = b;
    var d = 2*bb - 2*b*aa + aa;

    ellipse.push(new Point(0, b), new Point(0, -b));

    var px = Math.floor(aa/Math.sqrt(aa+bb));
    while (x <= px)
    {
        if (d < 0) d += 2*bb*(2*x+3);
        else
        {
            d += 2*bb*(2*x+3) - 4*aa*(y-1);
            y--;
        }
        x++;
        ellipse = ellipse.concat(get4sym(new Point(x, y)));
    }
    d = bb*(x*x+x) + aa*(y*y-y) - aa*bb;
    while (y>=0)
    {
        ellipse = ellipse.concat(get4sym(new Point(x, y)));
        y--;
        if (d < 0)
        {
            x++;
            d = d - 2*aa*y - aa + 2*bb*x + 2*bb;
        }
        else d = d - 2*aa*y - aa;
    }

    for (let i=0; i<ellipse.length; i++) // 将中心移至给定点
    {
        ellipse[i].x += center.x;
        ellipse[i].y += center.y;
    }

    drawShape(parent, ellipse);
}

// 栅栏填充
// TODO：解决栅栏线上的填充
function fenceFill(parent, points, fx, pattern=null)
{
    var pixelset = {};
    
    var n = points.length;
    var xmin, xmax, ymax, ymin, xi;

    for (let i=0; i<n-1; i++)
    {
        let ycur = points[i].y,
            ynext = points[i+1].y,
            xcur = points[i].x,
            xnext = points[i+1].x;
        
        ymax = Math.max(ycur, ynext);
        ymin = Math.min(ycur, ynext);

        let k = (xnext-xcur)/(ynext-ycur);

        for (let y=ymin; y<ymax; y++)
        {
            xi = parseInt((y-ycur)*k + xcur);
            xmax = Math.max(xi, fx);
            xmin = Math.min(xi, fx);
            
            // 着色
            for (let px=xmin; px<=xmax; px++)
            {
                if (pixelset[px]==null) pixelset[px]={};
                if (pixelset[px][y]==null)
                    pixelset[px][y] = true;
                else pixelset[px][y] = null;
            }
        }
    }

    var polypxs = [];
    for (let i in pixelset)
        for (let j in pixelset[i])
            if (pixelset[i][j] != null)
                polypxs.push(new Point(i, j));
    drawShape(parent, polypxs);

}

// 将center视为原点，计算pos相对其的坐标轴夹角
function getAngle(pos, center)
{
    const relpos = relativePos(pos, center);
    return Math.atan(relpos.y/relpos.x);
}

// 将center视为原点，根据坐标轴夹角和半径计算pos
function getPosByAngle(angle, center, r)
{
    return new Point(
        r*Math.cos(angle) + center.x,
        r*Math.sin(angle) + center.y
    );
}

// 3*3矩阵
// 注意a到i参考教材顺序，参数是以行优先顺序给出！
function CGMat(a=0, d=0, g=0, b=0, e=0, h=0, c=0, f=0, i=1)
{
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    this.g = g;
    this.h = h;
    this.i = i;
}

// 应用变换矩阵
// 思路：把锚点视为原点，以相对坐标变换，最后相对坐标转回世界坐标
function CGApplyTransform(points, mat, pivot)
{
    var res = [];
    for (let i=0; i<points.length; i++)
    {
        let relpos = relativePos(points[i], pivot);
        let x0 = relpos.x;
        let y0 = relpos.y;
        res.push(new Point(
            mat.a*x0 + mat.b*y0 + mat.c + pivot.x,
            mat.d*x0 + mat.e*y0 + mat.f + pivot.y
        ));
    }
    return res;
}

// 供变换用的多边形
function CGPolygon(varr, narr)
{
    // 顶点列表（最后一点必须与起点重合）
    this.varr = varr;
    this.varr_org = varr;
    
    // 控制节点列表
    this.narr = narr;
    this.narr_org = narr;

    // 绘制
    this.drawTo = function (graph, color){
        for (let i=0; i<this.varr.length-1; i++)
        {
            let line = getLine(this.varr[i], this.varr[i+1]);
            drawShapeToGraph(graph, line, color);
        }
    };

    // 应用变换矩阵
    this.applyTransform = function (mat, pivot){
        this.varr = CGApplyTransform(this.varr_org, mat, pivot);
        this.narr = CGApplyTransform(this.narr_org, mat, pivot);
    };

    // 保存修改
    this.applyMod = function (){
        this.varr_org = this.varr;
        this.narr_org = this.narr;
    };
}

// 供变换用的正方形
function CGSquare(p0, sidelen)
{
    const xmin = p0.x,
          xmax = p0.x + sidelen;
    const ymin = p0.y - sidelen,
          ymax = p0.y;

    var varr = [
        new Point(xmin, ymax),
        new Point(xmin, ymin),
        new Point(xmax, ymin),
        new Point(xmax, ymax),
        new Point(xmin, ymax)
    ];

    var narr = [
        new Point(xmin, ymax),
        new Point(xmin, ymax - sidelen/2),
        new Point(xmin, ymin),

        new Point(xmin+sidelen/2, ymin),

        new Point(xmax, ymin),
        new Point(xmax, ymin+sidelen/2),
        new Point(xmax, ymax),

        new Point(xmin+sidelen/2, ymax)
    ];

    return new CGPolygon(varr, narr);
}

// 供变换用的五角星
function CGStar(p0, r)
{
    const theta = Math.PI/2;
    const step = 2*Math.PI/5;
    var varr = [
        getPosByAngle(theta, p0, r),
        getPosByAngle(theta-2*step, p0, r),
        getPosByAngle(theta-4*step, p0, r),
        getPosByAngle(theta-step, p0, r),
        getPosByAngle(theta-3*step, p0, r)
    ]
    varr.push(varr[0]);

    const xmin = p0.x-r,
    xmax = p0.x+r;
    const ymin = p0.y-r,
    ymax = p0.y+r;

    var narr = [
        new Point(xmin, ymax),
        new Point(xmin, ymax - r),
        new Point(xmin, ymin),

        new Point(xmin+r, ymin),

        new Point(xmax, ymin),
        new Point(xmax, ymin+r),
        new Point(xmax, ymax),

        new Point(xmin+r, ymax)
    ];

    return new CGPolygon(varr, narr);
}

// 供变换用的六边形
function CGHexagon(p0, r)
{
    const theta = Math.PI/2;
    const step = 2*Math.PI/6;
    var varr = [
        getPosByAngle(theta, p0, r),
        getPosByAngle(theta-step, p0, r),
        getPosByAngle(theta-2*step, p0, r),
        getPosByAngle(theta-3*step, p0, r),
        getPosByAngle(theta-4*step, p0, r),
        getPosByAngle(theta-5*step, p0, r)
    ]
    varr.push(varr[0]);

    const xmin = p0.x-r,
    xmax = p0.x+r;
    const ymin = p0.y-r,
    ymax = p0.y+r;

    var narr = [
        new Point(xmin, ymax),
        new Point(xmin, ymax - r),
        new Point(xmin, ymin),

        new Point(xmin+r, ymin),

        new Point(xmax, ymin),
        new Point(xmax, ymin+r),
        new Point(xmax, ymax),

        new Point(xmin+r, ymax)
    ];

    return new CGPolygon(varr, narr);
}