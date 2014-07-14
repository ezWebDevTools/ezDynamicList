/**
* jQuery ezDynamicList.js
* Version: 0.5.0
* URL: http://ezDynamicList.com
* Description: Add / remove li-rows to a list (within a form). Lite-weight yet still has a robust set of defaults / options. 
* Requires: 1.8.1 (dev'ed with 1.8.1. Was yet not tested with newer or older versions) 
* Author: Mark "Chief Alchemist" Simchock (http://ChiefAlchemist.com) for Alchemy United (http://AlchemyUnited.com)
* Copyright: Copyright 2014 Alchemy United
* License: 
*
* The MIT License (MIT)
* 
* Copyright (c) 2014 Alchemy United
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/

/**
-- CHANGE LOG --

--0.5.0 - Mon 14 July 2014
-- Launched!

*/

// Plugin closure wrapper
(function($) {
  // Main plugin function
  $.fn.ezDynamicList = function(opts) {   
    // Overwrite user opts with plugin defaults
    var opts = $.extend({}, $.fn.ezDynamicList.defaults, opts);
	
	opts.initElement = $(this);
	
	// where's the default <li>? and hide it.
	$(opts.initElement).find(opts.selectorWrapDefaultLI).hide();
		
	// hide the max rows msg
	if (opts.boolMessageMaxRowsDefault == false){
		$(opts.initElement).find(opts.selectorMaxRowsClass).hide();
	}
		
	// disable all the inputs
	$(opts.initElement).find(opts.selectorParentUL + ' :input').attr('disabled', true);
	
	// automatically add a default row on page load? 
	if ( opts.boolAutoAddOnLoad === true ){
		doAdd();
	}
		
	// Let the games begin.
	cacheLastLI = doRefresh();
		
	// -- ADD CLICK --
	$(opts.initElement).find(opts.selectorAddClass).on("click", function() {
		
	// when max row is hit, we do hide() further below we hide the Add. this is just a fail safe. 
			if ($(opts.initElement).find(opts.selectorParentUL + ' ' + opts.rowWrapTag).size() >= opts.intMaxRows ){
				return
			}
			
			// pre-add callback
		    if (opts.cbAddPre){
			  opts.cbAddPre($(this), opts);
			}
			
			// is it ok to add a row? 
			if ( doRequiredToAction(this) != true ) {
				return false;
			}
					
			// ok then, add
			boolClick = true;
			cacheDefaultLI = doAdd(boolClick);
			cacheLastLI = doRefresh();
			// post-add callback
		    if (opts.cbAddPost){
			  opts.cbAddPost($(this), opts);
			}
			return false;			
		});  // End: Add Click
		
		
		// -- ACTION CLICK --
		// note: this isn't validation. it's fairly crude (at the moment) but it's better than nothing. DO also audit your data server-side. #Duh :)
		function doRequiredToAction(thisPassed){
		
			for ( var idRequired in opts.arrRequiredToAction ){
				// TODO - if possible cache: $(thisPassed).parents(opts.rowWrapTag) prior to the for()
				if ( typeof $(thisPassed).parents(opts.rowWrapTag).find(idRequired).val() === 'undefined' ||  $(thisPassed).parents(opts.rowWrapTag).find(idRequired).val() == '' ) {
					// if we find a bad egg the return
					return false;
				}
			}
			return true;
		}
		
		// -- EDIT CLICK --
		$(opts.initElement).find(opts.selectorEditClass).on("click", function() {
			
			// are we trying to edit a row that is different than the current
			if ( $(this).parents(opts.rowWrapTag).index() != opts.currentIndex){
				// if so, make sure that the current can pass the doRequiredToAction().
				// for example, if the input text is blank/empty you can not move to another row and edit it. one thing at a time, damn it :)			
				if ( doRequiredToAction( $(this).parents('ul').find('li').eq( opts.currentIndex ).find(opts.selectorEditClass) ) != true ) {
					return false;	
				}
			}
			
			// pre-edit callback
		    if (opts.cbEditPre){
			  opts.cbEditPre($(this), opts);
			}			
			// it's good! ok then, update the currentIndex and do the edit stuff
			opts.currentIndex = $(this).parents(opts.rowWrapTag).index() ;
		
			cacheRowWrapTag = $(opts.initElement).find(opts.selectorParentUL  + ' ' + opts.rowWrapTag);

			cacheRowWrapTag.find(':input').attr('disabled', true);
			cacheRowWrapTag.find(opts.selectorEditClass).show();
			cacheRowWrapTag.find(opts.selectorAddClass).hide();
			cacheRowWrapTag.find(opts.selectorRemoveClass).hide();

			// now enable the li-row we want to edit, and toggel the "buttons" too
			thisParentsRowWrapTag = $(this).parents(opts.rowWrapTag);
			thisParentsRowWrapTag.find(':input').removeAttr('disabled');
			thisParentsRowWrapTag.find(opts.selectorEditClass).show();
			thisParentsRowWrapTag.find(opts.selectorRemoveClass).show();
			
			// if it's the last row then adjust the action buttons
			if (thisParentsRowWrapTag.is(cacheRowWrapTag.last())){
				thisParentsRowWrapTag.find(opts.selectorEditClass).hide();
				// if it's the last row && we're maxed out then only show() remove ELSE show() add
				if (cacheRowWrapTag.size() == opts.intMaxRows){
					thisParentsRowWrapTag.find(opts.selectorRemoveClass).show();
				} else {
					thisParentsRowWrapTag.find(opts.selectorAddClass).show();
				}
			}
			// post-edit callback
		    if (opts.cbEditPost){
			  opts.cbEditPost($(this), opts);
			}
			return false;
		});
			
		// -- REMOVE CLICK --	
		$(opts.initElement).find(opts.selectorRemoveClass).on("click", function() {
		
		    // pre-remove callback
		    if (opts.cbRemovePre){
			  opts.cbRemovePre($(this), opts);
			}
		
			// not to confirm or confirm that is the question. 
			if (opts.boolConfirmRemove !== true) {
				$(this).parents(opts.rowWrapTag).fadeOut(opts.speedFadeOutLI, function() { $(this).remove(); cacheLastLI = doRefresh();});
			} else {
				if ( opts.cbConfirmRemove($(this), opts) ){
					$(this).parents(opts.rowWrapTag).fadeOut(opts.speedFadeOutLI, function() { $(this).remove(); cacheLastLI = doRefresh();});
				}
			}
			// post-remove call back
			if (opts.cbRemovePost){
			  opts.cbRemovePost($(this), opts);
			}
			return false;
		});
		
		// -- MOVE UP --	
		// http://stackoverflow.com/questions/617274/swapping-rows-in-jquery
		$(opts.initElement).find(opts.selectorMoveUp).on("click", function() {
		
			if (opts.boolMove == true){
				// is it ok to act on this row? 
				if ( doRequiredToAction(this) != true ) {
					return false;
				}
				// pre move up callback
				if (opts.cbUpPre){
					opts.cbUpPre($(this), opts);
				}
				// is it ok to act on the prev row? 
				if ( doRequiredToAction( $(this).parents(opts.rowWrapTag).prev(opts.rowWrapTag).find(opts.selectorMoveDown) ) != true ) {
					return false;
				}
				
				thisLI = $(this).parents(opts.rowWrapTag);
				if ( thisLI.index() >= opts.intMinRows ){
					thisLI.prev(opts.rowWrapTag).before(thisLI);
					cacheLastLI = doRefresh();
				}
				// post move up callback
				if (opts.cbUpPost){
					opts.cbUpPost($(this), opts);
				}
			}
		});
	
		// MOVE DOWN
		$(opts.initElement).find(opts.selectorMoveDown).on("click", function() {
		
			if (opts.boolMove == true){
						
				// is it ok to act on this row? 
				if ( doRequiredToAction(this) != true ) {
					return false;
				}
				
				// pre move down callback
				if (opts.cbDownPre){
					opts.cbDownPre($(this), opts);
				}
				
				// is it ok to act on the next row? 
				if ( doRequiredToAction( $(this).parents(opts.rowWrapTag).next(opts.rowWrapTag).find(opts.selectorMoveDown) ) != true ) {
					return false;
				}
			
				if (opts.boolMove == true){
					thisLI = $(this).parents(opts.rowWrapTag);
					thisLI.next(opts.rowWrapTag).after(thisLI);
					cacheLastLI = doRefresh();
				}
				// post move down callback
				if (opts.cbDownPost){
					opts.cbDownPost($(this), opts);
				}
			}
		});
		
		// -- ACTION CLICK CHECK --
		// note: this isn't validation. it's fairly crude (at the moment) but it's better than nothing. DO also audit your data server-side. #Duh :)
		function doRequiredToAction(thisPassed){
		
			for ( var idRequired in opts.arrRequiredToAction ){
				if ( typeof $(thisPassed).parents(opts.rowWrapTag).find(idRequired).val() === 'undefined' ||  $(thisPassed).parents(opts.rowWrapTag).find(idRequired).val() == '' ) {
					// if we find a bad egg the return
					return false;
				}
			}
			return true;
		}
		
		// -- DO ADD --
		function doAdd(boolClick){
			var cacheDefaultLI = $(opts.initElement).find(opts.selectorWrapDefaultLI);
					
			// is there room to add?
			if ( $(opts.initElement).find(opts.selectorParentUL + ' ' + opts.rowWrapTag).size() < opts.intMaxRows ){
			
				if ( boolClick === true && opts.boolAddCurrentClone === true){
				
					// .clone() doesn't play well with selects.
					// reference: http://stackoverflow.com/questions/742810/clone-isnt-cloning-select-values
					var allSelects = $(opts.initElement).find(opts.selectorParentUL + ' ' + opts.rowWrapTag + ':last').find("select"); 
					cloneLI = $(opts.initElement).find(opts.selectorParentUL + ' ' + opts.rowWrapTag + ':last').clone(true);
					// hide it then fadeIn
					$(opts.initElement).find(opts.selectorParentUL).append(cloneLI).hide().fadeIn(opts.speedFadeInLI);
					// re-cache the last row
					cacheNewLast = $(opts.initElement).find(opts.selectorParentUL + ' ' + opts.rowWrapTag + ':last');
					
					// put the selects' values back in place
					$(allSelects).each(function(i) {
						var select = this;
						cacheNewLast.find("select").eq(i).val($(select).val());
					});
	
					// reset anything? 
					// TODO - what if these are selects / checks / radio, etc? 
					for ( var classReset in opts.arrAddCurrentReset ){
						cacheNewLast.find(classReset).val('');
					}	
					
				}else{
					// show() it clone() it. hide() it. 
					cacheDefaultLI.show();
					cloneLI = cacheDefaultLI.find(opts.rowWrapTag).clone(true);
					cacheDefaultLI.hide();
					$(opts.initElement).find(opts.selectorParentUL).append(cloneLI).hide().fadeIn(opts.speedFadeInLI);
				}
			}
			return cacheDefaultLI;
		}
		
		// -- DO REFRESH --
		function doRefresh(){
		
			// pre-refresh callback
		    if (opts.cbRefreshPre){
			  opts.cbRefreshPre($(this), opts);
			}
		
			// let's be sensible and cache some stuff
			cacheRowWrapTag = $(opts.initElement).find(opts.selectorParentUL + ' ' + opts.rowWrapTag);
			cacheRowWrapTagLast = $(opts.initElement).find(opts.selectorParentUL + ' ' + opts.rowWrapTag + ':last');
			cacheRowWrapTagNotLast = $(opts.initElement).find(opts.selectorParentUL + ' ' + opts.rowWrapTag + ':not(:last)'); 
			
			if ( cacheRowWrapTag.size() == opts.intMinRows ){
				// only one row?
				cacheRowWrapTag.find(opts.selectorEditClass).hide();
				cacheRowWrapTag.find(opts.selectorRemoveClass).hide();	
				cacheRowWrapTag.find(opts.selectorAddClass).fadeIn(opts.speedFadeInLI);
			} else {
				// if it's not size() != min row
				cacheRowWrapTagNotLast.find(opts.selectorAddClass).hide();
				cacheRowWrapTagNotLast.find(opts.selectorRemoveClass).hide();
				cacheRowWrapTagNotLast.find(opts.selectorEditClass).fadeIn(opts.speedFadeInLI);
				
				cacheRowWrapTagLast.find(opts.selectorEditClass).hide();
				cacheRowWrapTagLast.find(opts.selectorRemoveClass).fadeIn(opts.speedFadeInLI);
	
				cacheRowWrapTagNotLast.find(':input').attr('disabled', true);	
			}
			
			if ($(opts.initElement).find(opts.selectorParentUL + ' ' + opts.rowWrapTag).size() >= opts.intMaxRows){
				// damn! we're maxed out so... hide() the add button and show the max'ed out msg
				$(opts.initElement).find(opts.selectorParentUL  + ' ' + opts.rowWrapTag + ':last ' + opts.selectorAddClass).hide();
				
				$(opts.initElement).find(opts.selectorMaxRowsClass).show();
				$(opts.initElement).find(opts.selectorMaxRowsClass).addClass(opts.classMessageMaxRowsAlert);
			} else {
				// within the max
				$(opts.initElement).find(opts.selectorParentUL  + ' ' + opts.rowWrapTag + ':last ' + opts.selectorAddClass).fadeIn(opts.speedFadeInLI);
				$(opts.initElement).find(opts.selectorMaxRowsClass).removeClass(opts.classMessageMaxRowsAlert);
				if (opts.boolMessageMaxRowsDefault == false){
					$(opts.initElement).find(opts.selectorMaxRowsClass).fadeOut(opts.speedFadeOutLI);
				}
			}
			
			// the last row needs to be de-disabled
			$(opts.initElement).find(opts.selectorParentUL + ' ' + opts.rowWrapTag + ':last :input').removeAttr('disabled');
			// now reset the currentIndex
			opts.currentIndex = $(opts.initElement).find(opts.selectorParentUL + ' ' + opts.rowWrapTag + ':last').index();
			
			// post-refresh callback
		    if (opts.cbRefreshPost){
			  opts.cbRefreshPost($(this), opts);
			}					
			return cacheRowWrapTagLast;
		}
		
		// -- SUBMIT CLICK --
		// disabled form elements will be ignored, so we need to de-disable them just prior to the submit
		$(opts.initElement).find(opts.selectorSubmitClass).on("click", function() {
			if (opts.boolSubmit){
				$(opts.initElement).find(opts.selectorParentUL + ' :input').removeAttr('disabled');
			}			
		});
		
	
  }; // end $.fn.PLUGIN

  // Default settings for the plugin
  $.fn.ezDynamicList.defaults = {
  
		rowWrapTag					: 'li',								// while currently untested, it might be possible to use <div>s or <span>s instead of <ul> + <li>s
		boolAddCurrentClone			: false,							// true : if you want the new add row to be copy (clone) of the current (last) row							
		arrAddCurrentReset			: {},								// when boolAddCurrentClone : true then which fields should be .val('').Listed in pairs - '.class1': 'input_type1', '.class2': 'input_type2'
		selectorWrapDefaultLI		: '.stash-default-li',				// where's the default li-row?
		selectorParentUL			: '.parent-ul',						// id of the ul we're going to build on
		boolAutoAddOnLoad			: true,								// when the page loads, add a new li-row?
		boolConfirmRemove			: true,							
		cbConfirmRemove				: function ($this, opts){ return confirm(opts.strConfirmRemoveMsg) }, // because maybe you want to get fancy w/ the confirm remove
		strConfirmRemoveMsg			: 'Delete this? Are you sure?',
		boolSubmit					: true,								// if false, be sure to de-disable your form elements. disabled elements will be ignored. 
		selectorSubmitClass			: '.submit',
		boolMove					: true,								// allow the move up / down functionality to work
		selectorMoveUp				: '.swap-up',
		selectorMoveDown			: '.swap-down',
		selectorAddClass			: '.action-row-add',
		selectorRemoveClass			: '.action-row-delete',
		selectorEditClass			: '.action-row-edit',
		speedFadeInLI				: 300,								
		speedFadeOutLI				: 150,
		intMinRows					: 2,								// note: if you have a li-row for col titles then be sure to account for that. the plugin doesn't know
		intMaxRows					: 6,								// note: if you have a li-row for col titles then be sure to account for that. the plugin doesn't know 
		boolMessageMaxRowsDefault	: false,							// 
		selectorMaxRowsClass		: '.max-row-msg',
		classMessageMaxRowsAlert	: 'max-row-msg-alert',				// NOTE: no leading .period, just the name please. the .period will muck up the addClass() / removeClass()
		arrRequiredToAction			: {},								// listed in pairs - '#some-id1': 'input_type1', '#some-id2': 'input_type2'
		cbRefreshPre				: '',
		cbRefreshPost				: '',
		cbAddPre					: '',
		cbAddPost					: '',
		cbRemovePre					: '',
		cbRemovePost				: '',
		cbEditPre					: '',
		cbEditPost					: '',
		cbUpPre						: '',
		cbUpPost					: '',
		cbDownPre					: '',
		cbDownPost					: ''
  }; // end defaults
  
})(jQuery); // end closure wrappers