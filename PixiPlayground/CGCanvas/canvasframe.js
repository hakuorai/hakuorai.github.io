// 创建画板
function createCanvas(width, height)
{
    var canvas = new PIXI.Container();
    canvas.zIndex = 0; // 最底层
    canvas.interactive = true;
    canvas.hitArea = new PIXI.Rectangle(0, 0, width, height);
    canvas.brushColor = 0xFFFFFF;

    // 更新尺寸，用于模拟画板无限大的效果
    canvas.updateArea = function (width, height){
        this.hitArea = new PIXI.Rectangle(-this.x, -this.y, width, height);
    };

    return canvas;
}

// 工具类 
function ToolbarItem(toolname, icon, onclickHandler, resources={})
{
    this.name = toolname; // String 工具名
    this.icon = icon; // PIXI.DisplayObject 工具图标
    this.onclickHandler = onclickHandler; // Function 点击图标时调用的函数
    this.resources = resources; // 其他资源
}

// 创建工具栏
function createToolbar(parent, _canvas, items, x, y, iconsize=60)
{
    // 异步加载图标
    const loader = PIXI.Loader.shared;
    var bar = new PIXI.Container();
    for (let i=0; i<items.length; i++)
    {
        loader.add(items[i].name, items[i].icon);
        for (let j in items[i].resources) // 加载其他资源
        {
            loader.add(j, items[i].resources[j]);
        }
    }
    loader.load((loader, resources) => {
        console.log('All resources loaded.');
        drawToolbar(bar, parent, _canvas, items, x, y, resources, iconsize);
    });
    return bar;
}

// 绘制工具栏
function drawToolbar(toolbar, parent, _canvas, items, x, y, resources, iconsize=60)
{
    
    toolbar.zIndex = 100; // 放在最顶层
    toolbar.position.set(x, y);
    parent.addChild(toolbar);

    // 计算工具栏尺寸
    const barheight = iconsize*items.length+10*(items.length+1); 
    const barweight = iconsize+20;

    // 绘制阴影
    var toolbarShadow = new PIXI.Graphics();
    toolbarShadow.beginFill(0, 0.8);
    toolbarShadow.drawRoundedRect(0, 0, barweight, barheight, 10);
    toolbarShadow.endFill();
    toolbarShadow.filters = [new PIXI.filters.BlurFilter()];
    toolbar.addChild(toolbarShadow);

    // 绘制底色
    var toolbarBG = new PIXI.Graphics();
    toolbarBG.beginFill(0xFFFFFF);
    toolbarBG.drawRoundedRect(0, 0, barweight, barheight, 10);
    toolbarBG.endFill();
    toolbar.addChild(toolbarBG);

    // 加载工具按钮
    console.log("Ready to load " + items.length + " tool items...");
    var lasty = 10;
    const loader = PIXI.Loader.shared;
    for (let i=0; i<items.length; i++, lasty+=iconsize+10)
    {
        console.log("Loading " + items[i].name);

        let titem = new PIXI.Container();
        titem.name = items[i].name;
        toolbar.addChild(titem);
        titem.position.set(10, lasty);

        // 设置已经加载好的图标
        let ticon = new PIXI.Sprite(resources[titem.name].texture);
        ticon.scale.set(iconsize/ticon.width, iconsize/ticon.height);
        titem.addChild(ticon);
        titem.icon = ticon;

        // 将其他资源载入
        titem.loadedres = {};
        for (let j in items[i].resources)
        {
            titem.loadedres[j] = resources[j].texture;
        }

        // 设置交互
        titem.interactive = true;
        titem.buttonMode = true;
        titem.onclickHandler = items[i].onclickHandler;
        titem.on("pointerdown", (event) => {
            // console.log("Now using " + toolbar.currentTool.name);
            titem.onclickHandler(_canvas);
            toolbar.currentTool = titem;
        });

        toolbar[titem.name] = titem;
        console.log(titem.name + " loaded.");
    }

    return toolbar;

}