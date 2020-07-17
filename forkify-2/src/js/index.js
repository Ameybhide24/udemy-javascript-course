// Global app controller
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import {elements,renderLoader,clearLoader} from './views/base';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';


/*
global state 
-search object
-current recipe
-shopping list
-liked recipes
*/
const state={};
//window.state=state;

/*
    SEARCH CONTROLLER
 */
const controlSearch=async()=>{
    
    //1.Get query from searchView.js
    const query =searchView.getInput();
    

    if(query){
        //2. New search object and add it to state
        state.search=new Search(query);

        //3. prepare UI
        searchView.clearInpur();
        searchView.clearResult();
        renderLoader(elements.searchRes);

        try{
            //4.retrieve data from api
            await state.search.getResults();
                
            //5.render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        }catch(error){
            console.log(error);
            alert('error processing search');
            clearLoader();
        }
        
        
    }
   
};

elements.searchForm.addEventListener('submit',e=>{
    e.preventDefault();
    controlSearch();
});


elements.searchResPages.addEventListener('click',e=>{
    const btn=e.target.closest('.btn-inline');
   // console.log(btn);
   if(btn){
    const gotoPage=parseInt(btn.dataset.goto,10);
    searchView.clearResult();
    searchView.renderResults(state.search.result,gotoPage);
   // console.log(gotoPage);

   }
   
   

});


/*
    RECIPE CONTROLLER
*/
 const controlRecipe=async()=>{
    const id=window.location.hash.replace('#','');
    //console.log(id);
    if(id){
        //prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //highlight selected item
        if(state.search) searchView.highlightSelected(id);
        
        //create new recipe object
        state.recipe=new Recipe(id);
                                        
        
        try{
             //get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();  
            //calculate time and servings
            state.recipe.calcTime();
            state.recipe.calcServing();
            //Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe,state.likes.isLiked(id));
        }catch(error){
            console.log(error);
            alert('error processing recipe');
        }
       
    }
}

['hashchange','load'].forEach(event=>window.addEventListener(event,controlRecipe));


/* 
    LIST CONTROLLER
*/

const controlList=()=>{
    //create a new list if there is none yet
    if(!state.list) state.list=new List();
    //add each ingredient to the list and ui
    state.recipe.ingredients.forEach(el=>{
        const item=state.list.addItem(el.count,el.unit,el.ingredient);
        
        listView.renderItem(item);
    });
}; 

//handle delete and update list item events
elements.shopping.addEventListener('click',e=>{
    const id=e.target.closest('.shopping__item').dataset.itemid;
   //2 console.log(id);
    
    //handle delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
       
        //delete from state 
        state.list.deleteItem(id);
        //delete from ui
        listView.deleteItem1(id);

        //handle the count update 
    }else if(e.target.matches('.shopping__count-value')){
        const val =parseFloat( e.target.value,10);
        state.list.updateCount(id,val);
    }
});

/* 
    LIKE CONTROLLER
*/


const controlLike=()=>{
    if(!state.likes)state.likes=new Likes();
    const currentID=state.recipe.id;
    //user has not yet liked current reipe
    if(!state.likes.isLiked(currentID)){

        //add like to the state
        const newLike=state.likes.addLike(currentID,state.recipe.title,state.recipe.author,state.recipe.img);

        //toggle the like button
        likesView.toggleLikeBtn(true);
        //add to ui
        likesView.renderLike(newLike);
        
    }
    //user has liked current reipe
    else{
        //remove like from the state
        state.likes.deleteLike(currentID);
        //toggle the like button
        likesView.toggleLikeBtn(false);
        //remove form ui
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//restore liked receipes on reload
window.addEventListener('load',()=>{
    state.likes=new Likes();

    //restore likes
    state.likes.readStorage();

    //toggle like menu buttom
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //render the existing likes
    state.likes.likes.forEach(like=>likesView.renderLike(like) );

});

//handling recipe button click
elements.recipe.addEventListener('click',e=>{
    if(e.target.matches(  '.btn-decrease, .btn-decrease *' )){
         //decrease button is clicked
        if(state.recipe.servings>1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
         
    }else if(e.target.matches(  '.btn-increase, .btn-increase *')){
        //increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if(e.target.matches('recipe__btn-add , .recipe__btn-add *')){
       //add ingerdient to the shopping list
        controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *')){
        //like controller
        controlLike();
    }
    
});


//window.l=new List();