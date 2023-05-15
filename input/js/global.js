// M${d.source.x},${d.source.y}A0,0 0 0,1 ${d.target.x},${d.target.y}
let win={
    w:undefined,
    h:undefined,
    axis:undefined
}


const dom={}
const svg={}


let mouse={
    x:0,
    y:0
}


const spotlight_paths=[
    {
        side:'box',
        x:'top',
        y:'left',
        m:{x:129.016,y:50.6816},
        d:'l -123.7289 9.032'
    },
    {
        side:'box',
        x:'top',
        y:'right',
        d:false
    },
    {
        side:'box',
        x:'bot',
        y:'left',
        m:{x:128.925,y:59.7129},
        d:'l -127.925 28.1722'
    },

    {
        side:'box',
        x:'bot',
        y:'right',
        d:'M107.74 0.751953L1.00488 27.9806',
        m:{x:128.74,y:68.752},
        d:'l -106.7351 27.2286'
    },
    {
        side:'back',
        x:'top',
        y:'left',
        m:{x:158.67, y:46.3901},
        d:'l 169.958 -45.3901'
    },
    {
        side:'back',
        x:'top',
        y:'right',
        d:false
    },
    {
        side:'back',
        x:'bot',
        y:'left',
        m:{x:158.67,y:57.0462},
        d:'l 173.151 -24.5735'
    },
    {
        side:'back',
        x:'bot',
        y:'right',
        m:{x:162.644,y:62.4212},
        d:'l 179.356 -10.7513'
    }
]




window.addEventListener('load',init);

function init(){
    dom.svg=d3.select('#spotlight-logo');
    dom.window=d3.select('#window');
    svg.aperture=d3.select('#aperture');
    svg.aperture_back=d3.select('#aperture-back');
    svg.aperture_glow=d3.select('#aperture-glow');
    svg.lens=d3.select('#lens')
    svg.paths=dom.svg
        .insert('g','path')
        .attr('class','paths')
        .selectAll('path')
   
    set_size();
    set_up_logo();
    window.addEventListener('resize',set_size);
    window.addEventListener('mousemove',set_cursor)
}

function set_size(){
    win.w=window.innerWidth;
    win.h=window.innerHeight;
    win.axis={x:win.w/2,y:win.h-90};
    dom.svg.attr('height',win.h)
    dom.svg.attr('width',win.w)
    dom.svg.attr('viewBox', `0 0 ${win.w} ${win.h}`);


}


function set_up_logo(){
    let options = {
        threshold: 1.0,
        rootMargin:'40px'
    };
    
    let observer = new IntersectionObserver(callback, options);
    observer.observe(document.querySelector('#spotlight-logo'));

    function callback(entries){
        if(entries[0].isIntersecting){
            console.log('!')
            update_spotlight(mouse);
        }else{
            update_spotlight({
                x:90,
                y:win.h-90
            });
            
        }
        
    }
}

function set_cursor(){
    mouse={
        x:mousex=event.clientX,
        y:mousex=event.clientY
    };
    requestAnimationFrame(function(){
        update_spotlight(mouse);
    })
    
    // console.log(event);
}




function update_spotlight(pos){
    let box={
        center:{x:pos.x,y:pos.y},
        top:pos.y-90,
        bot:pos.y+90,
        left:pos.x-90,
        right:pos.x+90
    }

    const t = d3.transition()
    .duration(750)
    .ease(d3.easeLinear);
    // svg.aperture.attr("points",`${box.left},${box.top} ${box.right},${box.top} ${box.right},${box.bot} ${box.left},${box.bot} ${box.left},${box.top}`).style('opacity',1);
    svg.aperture.attr('d',`M ${box.left} ${box.top} H ${box.right} V ${box.bot} H ${box.left} Z`).style('opacity',1);
    let back={
        left:win.axis.x +  (box.left - win.axis.x) * -1,
        right:win.axis.x + (box.right - win.axis.x) * -1,
        top:win.axis.y + (box.top - win.axis.y) * -1,
        bot:win.axis.y + (box.bot - win.axis.y) * -1
    }
    // svg.aperture_back.attr("points",`${diffs.left},${diffs.top} ${diffs.right},${diffs.top} ${diffs.right},${diffs.bot} ${diffs.left},${diffs.bot} ${diffs.left},${diffs.top}`).style('opacity',1);
    svg.aperture_back.attr('d',`M ${back.left} ${back.top} H ${back.right} V ${back.bot} H ${back.left} Z`).style('opacity',1);

    // svg.aperture_back
    svg.aperture_glow.style('left',box.left+'px').style('top',box.top+'px').style('opacity',1);
    dom.window.style('mask-position',`${box.left}px ${box.top}px`).style('-webkit-mask-position',`${box.left}px ${box.top}px`);
    
    let angle=Math.atan2(box.center.x-win.axis.x,box.center.y-win.axis.y);
    svg.lens.style('--rad',(-1*angle+Math.PI/2)+'rad');

    update_paths({box,back})

}

function update_paths(coords){
    svg.paths=svg.paths.data(spotlight_paths, d=>`${d.x}-${d.y}-${d.side}`)
        .join(
            enter=>enter.append('path')
            .attr('data-line',d=>`${d.x}-${d.y}-${d.side}`)
            .attr('d',d=>{
                return `M ${win.axis.x} ${win.axis.y}  L ${coords[d.side][d.y]} ${coords[d.side][d.x]}`
            }),
        update=>update.attr('d',d=>{
            return `M ${win.axis.x} ${win.axis.y}  L ${coords[d.side][d.y]} ${coords[d.side][d.x]}`
        }))
}