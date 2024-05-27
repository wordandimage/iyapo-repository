console.log(tags,cluster);

window.addEventListener('load',init)

let tag_boxes=[];
let tags_selected_box;
let filter_box;
let tags_selected={
    narrative:[],
    object:[],
    domain:[]
}
let n_selected=0;
let card_container;
let cards;


function init(){
    
    if(cluster=='manuscripts'){
        tag_boxes= Array.from(document.querySelectorAll('#filter input[type="checkbox"]'));
        tags_selected_box=document.querySelector('.selected-tags');
        filter_box=document.querySelector('#filter');
        card_container=document.querySelector('#cards');
        cards=Array.from(document.querySelectorAll('.card'));


        let resize_observer=new ResizeObserver(function(){
            console.log('resize box')
            filter_box.style.setProperty('--h',document.querySelector('#top-bar').offsetHeight+'px')
        })

        resize_observer.observe(document.querySelector('#top-bar'));

       tag_boxes.forEach((checkbox)=>{
            checkbox.addEventListener('change',evaluate_tags)
        })
    }

    target_blank();
}

function evaluate_tags(){
    let checked_boxes=tag_boxes.filter(a=>a.checked);
    filter_box.dataset.selected=checked_boxes.length;
    n_selected=checked_boxes.length
    // tags_selected_box.innerHTML='';
    card_container.classList.toggle('filtering',n_selected>0);
    tags_selected={
        narrative:[],
        object:[],
        domain:[]
    }

    for(let box of checked_boxes){
        let button=document.createElement('button');
        let category=box.parentNode.parentNode.dataset.category;
        let tag=box.dataset.tag;
        tags_selected[category].push(tag);
        if(!tags_selected_box.querySelector(`.selected-tag[data-category="${category}"][data-tag="${tag}"]`)){
            button.innerText=tag;
            button.dataset.category=category;
            button.dataset.tag=tag;
            button.classList.add('col-'+category)
            button.classList.add('selected-tag')
            button.addEventListener('click',remove_tag);
            tags_selected_box.appendChild(button);
        }
        
        
    }


    filter_cards();
}


function remove_tag(e){
    let category=e.currentTarget.dataset.category;
    let tag=e.currentTarget.dataset.tag;
    let box=document.querySelector(`#${category}-${tag.toLowerCase().replaceAll(' ','-')}`)
    if(box) box.checked=false;
    e.currentTarget.remove();
    evaluate_tags();
}

function filter_cards(){
    for(let card of cards){
        let narrative=card.dataset.narrative;
        let object=card.dataset.object;
        let domain=card.dataset.domain;
        card.classList.toggle('in-filter',
            n_selected==0
            || (
               (tags_selected.narrative.length==0 || tags_selected.narrative.includes(narrative))
                && (tags_selected.object.length==0 || tags_selected.object.includes(object))
                && (tags_selected.domain.length==0 || tags_selected.domain.includes(domain))
            )
        )
    }
}

function target_blank(){
    document.querySelectorAll('a').forEach(link=>{
        console.log(link.host,window.location.host);
        if(link.host!==window.location.host){
            link.setAttribute('target', '_blank');
        }
    })
}