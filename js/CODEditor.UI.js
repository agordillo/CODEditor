CODEditor.UI = (function(C,$,undefined){

	var init = function(options){
		if(CODEditor.CORE.isEditorMode()){
			$("ul.menu li.viewer:not(.editor)").css("display","none");
			$("#open").removeClass("first");
			$("#openurl").addClass("last");
			$("title").html("CODEditor");

			//Metadata panel

			//Keywords
			var suggestedTags = ["HTML","JavaScript","CSS","JQuery","Computer Science"];
			$("#metadata_keywords").tagit({
				tagSource: suggestedTags,
				sortable:true,
				maxLength: 40,
				maxTags: 8,
				triggerKeys: ['enter', 'comma', 'tab'],
				watermarkAllowMessage: "Añadir keywords",
				watermarkDenyMessage: "No puedes añadir más keywords"
			});

			//Difficulty
			var difficulty;
			if(typeof difficulty != "string"){
				difficulty = "unspecified";
			}

			var LOM_difficulty = [];
			LOM_difficulty[0] = { value: "unspecified", text: "sin especificar"};
			LOM_difficulty[1] = { value: "very easy", text: "muy fácil"};
			LOM_difficulty[2] = { value: "easy", text: "fácil"};
			LOM_difficulty[3] = { value: "medium", text: "media"};
			LOM_difficulty[4] = { value: "difficult", text: "difícil"};
			LOM_difficulty[5] = { value: "very difficult", text: "muy difícil"};

			var difficultyNValue;
			for(var d=0; d<LOM_difficulty.length; d++){
				if(d.value===difficulty){
					difficultyNValue = d;
				}
			}
			if(typeof difficultyNValue != "number"){
				difficultyNValue = 0;
			}

			$("#metadata_difficulty_slider").slider({
				min: 0,
				max: 5,
				value: [ difficultyNValue ],
				slide: function(event, ui) {
					$("#metadata_difficulty_range").attr("difficulty",ui.value);
					$("#metadata_difficulty_range").val(LOM_difficulty[ui.value].text);
				}
			});
			$("#metadata_difficulty_range").attr("difficulty",difficultyNValue);
			$("#metadata_difficulty_range").val(LOM_difficulty[difficultyNValue].text);

			//TLT
			$(document).on('change', '#tlt_hours, #tlt_minutes, #tlt_seconds', _onTLTchange);
			$(document).on('keyup', '#tlt_hours, #tlt_minutes, #tlt_seconds', _onTLTchange);
			_onTLTchange();

			//Age Range
			var ageMin;
			var ageMax;

			if(typeof ageMin !== "number"){
				ageMin = 0;
			}
			if(typeof ageMax !== "number"){
				ageMax = 30;
			}

			$("#metadata_age_range_slider").slider({
				range: true,
				min: 0,
				max: 30,
				values: [ ageMin, ageMax ],
				slide: function(event, ui) {
					$("#metadata_age_range").val( ui.values[0] + " - " + ui.values[1] );
				}
			});
			$("#metadata_age_range").val(ageMin + "-" + ageMax);

		} else {
			$("ul.menu li.editor:not(.viewer)").css("display","none");
			$("title").html("CODEditor: Viewer");
		}
		adjustView();
	};

	var adjustView = function(){
		//Adjust Heights
		var windowHeight = $(window).height();
		var headerHeight = $("#header").outerHeight();
		var contentHeight = windowHeight-headerHeight;

		var exerciseHeight = $("#exercise_wrapper").outerHeight();
		var wrappersHeight = contentHeight - exerciseHeight;
		$("#editor_wrapper, #preview_wrapper").height(wrappersHeight);

		var editorSubheaderHeight = $("#editor_header").outerHeight();
		var editorHeight = wrappersHeight - editorSubheaderHeight;
		$("#editor").height(editorHeight);

		var previewSubheaderHeight = $("#preview_header").outerHeight();
		var previewHeight = wrappersHeight - previewSubheaderHeight;
		$("#preview").height(previewHeight);

		//Adjust Panels (Settings, Examples, ...)
		$(".cpanel").height(contentHeight*0.95-$(".cpanel").cssNumber("padding-right")*2);
		$(".cpanel").css("top",40+contentHeight*0.025);

		//More adjustments...
		// var glutterWidth = $("div.ace_layer.ace_gutter-layer.ace_folding-enabled").width();

		//Adjust widhts in hybrid mode
		if(C.CORE.getCurrentViewMode()==="HYBRID"){
			var totalWidth = $("#content").outerWidth();
			var editorWrapperWidth = Math.floor(totalWidth/2);
			$("#editor_wrapper").width(editorWrapperWidth);
			var newEditorWrapperWidth = $("#editor_wrapper").outerWidth();
			var previewWrapperWidth = totalWidth - newEditorWrapperWidth - 0.5;
			$("#preview_wrapper").width(previewWrapperWidth);
		}

		if ($("#test_header").is(":visible")){
			$("#test_header").width($("#content").outerWidth() - $("#test_header").cssNumber("padding-right") - $("#test_header").cssNumber("padding-left"));
		}

		var editor = C.CORE.getEditor();
		if(typeof editor !== "undefined"){
			editor.resize();
		};
	};

	var updateSettingsPanel = function(){
		var fontsize = document.getElementById('editor').style.fontSize;
		fontsize = (fontsize.trim()=="" ? "12px" : fontsize);
		$("#settings_fontsize option[value='"+fontsize+"']").attr("selected","selected");

		$("#settings_mode option[value='"+C.CORE.getCurrentEditorMode()+"']").attr("selected","selected");
	};

	var cleanPreview = function(){
		$("#preview").html("");
	};

	var updateUIAfterNewExerciseOnTest = function(){
		var currentTest = C.CORE.getCurrentTest();
		var currentExerciseIndex = C.CORE.getCurrentExerciseIndex();
		$("#test_menu_wrapper p").html(currentExerciseIndex.toString() + "/" + currentTest.exercisesQuantity.toString());
	};

	var updateTestMenuDialog = function(){
		var currentTest = C.CORE.getCurrentTest();
		var currentExercise = C.CORE.getCurrentExercise();

		var menuDOM = $("#test_exercises_dialog");
		$(menuDOM).html("");

		if(C.CORE.isEditorMode()){
			//Add "New Exercise" button
			var newExerciseButton = $('<div id="newExerciseButton" class="codeditor_button"><img src="img/glyphicons-433-plus.png"/> Crear nuevo ejercicio</div>');
			$(menuDOM).prepend(newExerciseButton);

			$("#newExerciseButton").click(function(){
				C.CORE.createExercise();
			});
		}

		var exercisesList = $("<ul></ul>");
		var exercisesLength = currentTest.parsed_exercises.length;
		for(var i=0; i<exercisesLength; i++){
			var exercise = currentTest.parsed_exercises[i];
			var exerciseIndex = (i+1);
			var li = $("<li exerciseIndex='" + exerciseIndex.toString() + "'></li>");
			var exerciseEntryViewerWrapper = $("<div class='exerciseEntryViewerWrapper'></div>");
			var exerciseProgressIconWrapper = $("<div class='exerciseProgressIcon'></div>");
			var exerciseIndexAndTitleWrapper = $("<div class='index_and_title_wrapper'></div>");
			var exerciseIndexSpan = $("<span class='exerciseIndex'>" + exerciseIndex.toString() + ". </span>");
			var exerciseTitleSpan = $("<span class='exerciseTitle'>" + exercise.title + "</span>");
			$(exerciseEntryViewerWrapper).append(exerciseProgressIconWrapper);
			$(exerciseIndexAndTitleWrapper).append(exerciseIndexSpan);
			$(exerciseIndexAndTitleWrapper).append(exerciseTitleSpan);
			$(exerciseEntryViewerWrapper).append(exerciseIndexAndTitleWrapper);
			$(li).append(exerciseEntryViewerWrapper);

			if(C.CORE.isEditorMode()){
				var exerciseEntryEditorWrapper = $("<div class='exerciseEntryEditorWrapper'></div>");
				if(exercisesLength > 1){
					var removeExerciseButton = $('<img src="img/glyphicons-17-bin.png" action="delete" title="Borrar ejercicio"/>');
					$(exerciseEntryEditorWrapper).append(removeExerciseButton);
				}
				$(li).append(exerciseEntryEditorWrapper);
			}
			
			if(exercise.progress.passed === true){
				$(li).addClass("passed");
				$(li).find(".exerciseProgressIcon").append("<img src='img/success_icon.png'/>");
			} else if(exerciseIndex===currentTest.currentExerciseIndex){
				// if(exercise===currentExercise)
				$(li).addClass("current");
				$(li).find(".exerciseProgressIcon").append("<span>></span>");
			}
			$(exercisesList).append(li);
		}
		$(menuDOM).append(exercisesList);

		//Reload events
		$("#test_exercises_dialog ul li").find(".exerciseEntryViewerWrapper").click(function(){
			var exerciseIndex = parseInt($(this).parents("li").attr("exerciseindex"));
			if((typeof exerciseIndex === "number")&&(!isNaN(exerciseIndex))){
				C.CORE.loadTestExercise(exerciseIndex);
				$("#test_exercises_dialog").dialog('close');
			}
		});

		if(C.CORE.isEditorMode()){
			$("#test_exercises_dialog ul li").find(".exerciseEntryEditorWrapper img[action]").click(function(){
				var exerciseIndex = parseInt($(this).parents("li").attr("exerciseindex"));
				switch($(this).attr("action")){
					case "delete":
						var r = confirm("¿Estás seguro de que deseas borrar este ejercicio?");
						if (r === true) {
							C.CORE.deleteExercise(exerciseIndex);
							updateUIAfterNewExerciseOnTest();
						}
						break;
					default:
						break;
				}
			});

			//Sortable
			$("#test_exercises_dialog ul").sortable({
				stop: function( event, ui ) {
					var oldExerciseIndex = parseInt($(ui.item).attr("exerciseindex"));
					
					var prevElement = $(ui.item).prev();
					var newExerciseIndex;
					if($(prevElement).length===0){
						newExerciseIndex = 1;
					} else {
						var prevExerciseIndex = parseInt($(prevElement).attr("exerciseindex"));
						if(oldExerciseIndex > prevExerciseIndex){
							newExerciseIndex = prevExerciseIndex + 1;
						} else if (oldExerciseIndex < prevExerciseIndex){
							newExerciseIndex = prevExerciseIndex;
						}
					}

					C.CORE.moveExercise(oldExerciseIndex,newExerciseIndex);
					C.UI.updateTestMenuDialog();
				}
			});
		}
		
	};

	var _onTLTchange = function(event){
		if((event)&&(event.keyCode===13)){
			$(event.target).blur();
			return;
		}

		var TLT = _getTLT();
		if(TLT===null){
			$("#tlt_current_value").val("valor inválido");
		} else if(typeof TLT == "undefined"){
			$("#tlt_current_value").val("sin especificar");
		} else if(typeof TLT == "string"){
			$("#tlt_current_value").val(TLT);
		}
	};

	var _getTLT = function(){
		var TLT = "PT";
		var hours = $("#tlt_hours").val();
		var minutes = $("#tlt_minutes").val();
		var seconds = $("#tlt_seconds").val();

		if(jQuery.isNumeric(hours)&&jQuery.isNumeric(minutes)&&jQuery.isNumeric(seconds)){
			hours = parseInt(hours);
			minutes = parseInt(minutes);
			seconds = parseInt(seconds);

			var totalSecs = seconds + minutes*60 + hours*60*60;
			if(totalSecs===0){
				return undefined;
			}
			return CODEditor.Utils.iso8601Parser.getISODurationFromSecs(totalSecs);
		}
		return null;
	};

	return {
		init 							: init,
		adjustView						: adjustView,
		updateSettingsPanel 			: updateSettingsPanel,
		cleanPreview					: cleanPreview,
		updateUIAfterNewExerciseOnTest	: updateUIAfterNewExerciseOnTest,
		updateTestMenuDialog			: updateTestMenuDialog
	};

}) (CODEditor,jQuery);