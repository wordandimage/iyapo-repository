
// M${d.source.x},${d.source.y}A0,0 0 0,1 ${d.target.x},${d.target.y}
let win={
    w:undefined,
    h:undefined,
    axis:undefined
}

let scroll_y=0;

const dom={}
const svg={}
const svg_back={}


let mouse={
    x:0,
    y:0
}


const scope_paths=[
    {
        side:'box',
        x:'top',
        y:'left'
    },
    {
        side:'box',
        x:'top',
        y:'right'
    },
    {
        side:'box',
        x:'bot',
        y:'left'
    },
    {
        side:'box',
        x:'bot',
        y:'right'
    }
]

let scope_back_paths=[
    {
        side:'back',
        x:'top',
        y:'left'
    },
    {
        side:'back',
        x:'top',
        y:'right',

    },
    {
        side:'back',
        x:'bot',
        y:'left'
    },
    {
        side:'back',
        x:'bot',
        y:'right'
    }
]




window.addEventListener('load',init);

function init(){
    if(is_landing){
        dom.svg=d3.select('#scope');
        dom.svg_back=d3.select('#scope-back')
        dom.body=d3.select('body')
        dom.archive_window=d3.select('#archive-window');
        dom.archive_content=d3.select('#archive-content-wrapper');
        svg.aperture=d3.select('#aperture');
        svg_back.aperture=d3.select('#aperture-back');
        svg.aperture_dom=d3.select('#aperture-dom');
        dom.lens=d3.select('#lens')
        svg.paths=dom.svg
            .insert('g','path')
            .attr('class','paths')
            .selectAll('path')
        svg_back.paths=dom.svg_back
            .insert('g','path')
            .attr('class','paths')
            .selectAll('path')
    
        set_size();
        set_up_logo();
        set_scroll();
        window.addEventListener('resize',set_size);
        window.addEventListener('scroll',set_scroll)
        
        dom.archive_window.on('mousemove',set_cursor)

        generate_galaxy();
    }
    
}


function poisson_point_place(points=[],dimensions={x:1,y:1},radius=0.05,constraints={x:[0,1],y:[0,1]}){
    let new_point={x:-1,y:-1};
    let half_r=radius*0.5;
    let attempts=0;

    let x={
        span:constraints.x[1] - constraints.x[0],
        min:constraints.x[0]
    }

    let y={
        span:constraints.y[1] - constraints.y[0],
        min:constraints.y[0]
    }

    while(new_point.x==-1&&new_point.y==-1){
        let try_coords={
            x: (x.min + x.span * Math.random())*dimensions.w,
            y:(y.min + y.span * Math.random())*dimensions.h
        };
        let in_range=points.filter(a=>{
            return a.x>try_coords.x-half_r
                 &&a.x<try_coords.x+half_r
                 &&a.y>try_coords.y-half_r
                 &&a.y<try_coords.y+half_r
        })
        let fits=true;
        for(let p of in_range){
            if(distance(p,try_coords)<radius&&attempts<50) fits=false;
        }
        if(fits) new_point=try_coords;
        else attempts++;
    }

    return new_point;

}

function distance(p0,p1){
    return Math.sqrt((p0.x - p1.x)**2 + (p0.y - p1.y)**2);
}

function generate_galaxy(){
    let points=[];
    let dims=win;

    let dist=0.1;
    for(let cluster of archive_clusters){
        let radius=0.05;
        let constraints={
            x:[cluster.pos.x-radius,cluster.pos.x+radius],
            y:[cluster.pos.y-radius,cluster.pos.y+radius]
        }
        for(let p=0;p<7;p++){
            let point=poisson_point_place(points,dims,dims.w*0.015,constraints);
            point.i=p;
            point.type='cluster '+cluster.name;
            points.push(point);
        }
    }

    for(let p=0;p<30;p++){
        let point=poisson_point_place(points,dims,dims.w*dist);
        point.i=p;
        point.type='';
        points.push(point);
    }

    
    let points_mapped=points.map(a=>{
        return {
            i:a.i,
            type:a.type,
            x:a.x/dims.w,
            y:a.y/dims.h
        }
    })





    d3.select('#galaxy').selectAll('span').data(points_mapped,(d)=>d.type+d.i)
    .join(
        enter=>enter.append('span').text('*').attr('class',(d)=>`star ${d.type}`).style('--x',(d)=>d.x).style('--y',(d)=>d.y)
    )

    let cluster_points=points_mapped.filter(a=>a.type.includes('cluster'))

    d3.select('#archive-content-wrapper .star-shadows').selectAll('span').data(cluster_points,(d)=>d.type+d.i)
    .join(
        enter=>enter.append('span').text('*').attr('class',(d)=>`star ${d.type}`).style('--x',(d)=>d.x).style('--y',(d)=>d.y)
    )

    dom.cluster_stars=d3.selectAll('.star.cluster')

    // console.log(archive_clusters);
    // for(let cluster of archive_clusters){
    //     let boxes=d3.selectAll(`.cluster[data-cluster="${cluster.name}"]`);
    //     let stars=[];
    //     for(let i=1; i<8; i++){
    //         stars.push([0,1]);
    //     }
    // }

    // let galaxy=d3.select('#galaxy');
   



    // for(let i=0; i<7; i++){

    // }

}


function set_scroll(){
    scroll_y=window.scrollY;
    
    requestAnimationFrame(()=>{
        dom.body.style('--scrolly',scroll_y);
        dom.body.classed('scrolled',scroll_y>2)
        dom.body.classed('transitioned-logo',scroll_y>100)
    })
}

function set_size(){
    win.w= dom.archive_window.node().offsetWidth;
    dom.archive_window.style('--archive-w',win.w+'px');
    // win.h=dom.archive_content.node().offsetHeight;
    win.h= dom.archive_window.node().offsetHeight;
    win.axis={x:win.w/2,y:win.h};
    dom.svg.attr('height',win.h)
    dom.svg.attr('width',win.w)
    dom.svg.attr('viewBox', `0 0 ${win.w} ${win.h}`);

    let full_win_w=window.innerWidth;
    let margin=(full_win_w - win.w) / 2;
    console.log(margin)

    dom.svg_back.attr('height',win.h)
    dom.svg_back.attr('width',full_win_w)
    dom.svg_back.style('width',full_win_w+'px')
    dom.svg_back.attr('viewBox', `${margin * -1} ${win.h} ${win.w + margin*2} ${win.h*2}`);
}


function set_up_logo(){
    let options = {
        threshold: 1.0,
        rootMargin:'40px'
    };
    
    let observer = new IntersectionObserver(callback, options);
    observer.observe(document.querySelector('#scope'));

    function callback(entries){
        if(entries[0].isIntersecting){
            console.log('!')
            update_scope(mouse);
        }else{
            // update_scope({
            //     x:90,
            //     y:win.axis.y
            // });
            
        }
        
    }
}

function set_cursor(){
    mouse={
        x:mousex=event.offsetX,
        y:mousex=event.offsetY
    };
    requestAnimationFrame(function(){
        update_scope(mouse);
    })
    
    // console.log(event);
}




function update_scope(pos){
    let box={
        center:{x:pos.x,y:pos.y},
        top:pos.y-90,
        bot:pos.y+90,
        left:pos.x-90,
        right:pos.x+90
    }

    // svg.crosshair.style('transform',`translate(${pos.x-10}px,${pos.y-10}px)`)

   
    // svg.aperture.attr("points",`${box.left},${box.top} ${box.right},${box.top} ${box.right},${box.bot} ${box.left},${box.bot} ${box.left},${box.top}`).style('opacity',1);
    svg.aperture.attr('d',`M ${box.left} ${box.top} H ${box.right} V ${box.bot} H ${box.left} Z`)
    let back={
        left:win.axis.x +  (box.left - win.axis.x) * -1 * 20,
        right:win.axis.x + (box.right - win.axis.x) * -1 * 20,
        top:win.axis.y + (box.top - win.axis.y) * -1 * 20,
        bot:win.axis.y + (box.bot - win.axis.y) * -1 * 20
    }

    // svg.aperture_back.attr('d',`M ${back.left} ${back.top} H ${back.right} V ${back.bot} H ${back.left} Z`).style('opacity',1);


    svg.aperture_dom.style('left',box.left+'px').style('top',box.top+'px');
    dom.archive_content.style('mask-position',`${box.left}px ${box.top}px`).style('-webkit-mask-position',`${box.left}px ${box.top}px`);
    
    let angle=Math.atan2(box.center.x-win.axis.x,box.center.y-win.axis.y);
    dom.lens.style('--rad',(-1*angle+Math.PI/2)+'rad');
    dom.lens.classed('left',pos.x<win.axis.x)
    // console.log(pos.x,win.x/2)



    let intersecting=dom.cluster_stars.filter((d,i)=>{
        let left=d.x * win.w;
        let top=d.y * win.h;

        return left>box.left 
            && left<box.right
            && top>box.top
            && top<box.bot;
    }).data()
    
    dom.svg.classed('intersecting-cluster',intersecting.length>0);
    svg.aperture_dom.text(intersecting.length>0?intersecting[0].type.replace('cluster ',''):'');

    update_paths({box,back})

}

function update_paths(coords){
    svg.paths=svg.paths.data(scope_paths, d=>`${d.x}-${d.y}-${d.side}`)
        .join(
            enter=>enter.append('path').attr('class',d=>'side-'+d.side)
            .attr('data-line',d=>`${d.x}-${d.y}-${d.side}`)
            .attr('vector-effect','non-scaling-stroke')
            .attr('d',d=>{
                return `M ${win.axis.x} ${win.axis.y}  L ${coords[d.side][d.y]} ${coords[d.side][d.x]}`
            }).each((d,i,nodes)=>{
                d3.select(nodes[i]).style('--l',nodes[i].getTotalLength())
            }),
        update=>update.attr('d',d=>{
            return `M ${win.axis.x} ${win.axis.y}  L ${coords[d.side][d.y]} ${coords[d.side][d.x]}`
        }).each((d,i,nodes)=>{
            d3.select(nodes[i]).style('--l',nodes[i].getTotalLength())
        }))

    svg_back.paths=svg_back.paths.data(scope_back_paths, d=>`${d.x}-${d.y}-${d.side}`)
        .join(
            enter=>enter.append('path').attr('class',d=>'side-'+d.side)
            .attr('data-line',d=>`${d.x}-${d.y}-${d.side}`)
            .attr('vector-effect','non-scaling-stroke')
            .attr('d',d=>{
                return `M ${win.axis.x} ${win.axis.y}  L ${coords[d.side][d.y]} ${coords[d.side][d.x]}`
            }).each((d,i,nodes)=>{
                d3.select(nodes[i]).style('--l',nodes[i].getTotalLength())
            }),
        update=>update.attr('d',d=>{
            return `M ${win.axis.x} ${win.axis.y}  L ${coords[d.side][d.y]} ${coords[d.side][d.x]}`
        }).each((d,i,nodes)=>{
            d3.select(nodes[i]).style('--l',nodes[i].getTotalLength())
        }))
}