/**
 * CODE Editor
 * CODE Editor is a HTML5 application to learn web technologies.
 * https//github.com/agordillo/CodeEditorApp
 *
 * @module CODEditor
 */
var CODEditor = CODEditor || {};

CODEditor.VERSION = '0.0.1';
CODEditor.AUTHORS = 'Aldo Gordillo';
CODEditor.URL = "http://github.com/agordillo/CodeEditorApp";



CODEditor.CORE = (function(C,$,undefined){

	var _editor; //ACE editor instance

	var _viewModes = ["CODE","RESULT","HYBRID"];
	var _currentViewMode;

	var _editorModes = ["HTML","JavaScript"];
	var _currentEditorMode;

	var _editorThemes = ["Chrome","Twilight"];
	var _currentEditorTheme;

	var _currentTest;
	var _currentExercise;

	var _isDefaultMode = false;

	var _examples = {};


	var init = function(options){
		CODEditor.Utils.init();
		CODEditor.FullScreen.init();
		CODEditor.Score.init();

		//Default view mode (CODE)
		_changeViewMode(_viewModes[0]);

		CODEditor.UI.init();
		_initEditor();
		CODEditor.UI.updateSettingsPanel();

		_loadEvents();

		CODEditor.JS.init();
		CODEditor.HTML.init();

		var URLparams = _readParams();

		if(typeof URLparams["file"] === "string"){
			_onGetExternalJSONFile(URLparams["file"],URLparams);
		} else {
			//Testing
			// _loadJSON(CODEditor.Samples.getExample("js_sample_code"));
			_initDefaultMode(URLparams);
		}
	};


	var _onGetExternalJSONFile = function(fileURL,initParams){
		if((typeof fileURL !== "string")||(fileURL.trim() === "")){
			return CODEditor.Utils.showDialog("La URL del fichero no es válida.");
		}

		//Allow to include default ViSH URLs for JSON files uploaded to http://vishub.org.
		var vishDocMatching = fileURL.match(/^http:\/\/vishub.org\/documents\/[0-9]+$/);
		if((vishDocMatching instanceof Array)&&(vishDocMatching.length === 1)){
			fileURL = vishDocMatching[0] + ".txt";
		}

		_getExternalJSONFile(fileURL,function(json){
			//On success
			if(_isValidJSON(json)){
				_loadJSON(json);
			} else {
				CODEditor.Utils.showDialog("El recurso cargado no es válido.");
				if(typeof initParams !== "undefined"){
					_initDefaultMode(initParams);
				}
			}
		}, function(jqXHR,textStatus,errorThrown){
			//On failure
			CODEditor.Utils.showDialog("Error loading external script from " + fileURL);
			if(typeof initParams !== "undefined"){
				_initDefaultMode(initParams);
			}
		});
	};

	//Init CODeditor when no excercise is loaded
	var _initDefaultMode = function(initParams){
		$("ul.menu li[group*='examples']").css("display","inline-block");
		_populateExamples();

		if(typeof initParams["emode"] === "string"){
			_changeEditorMode(initParams["emode"]);
		}

		_isDefaultMode = true;
	};

	var _populateExamples = function(){
		var allExamples = CODEditor.Samples.getExamples();
		var selector = $("#examples_panel #examples_selection");

		for(var i=0; i<allExamples.length; i++){
			var example = allExamples[i];
			var eEditorMode;
			var eTitle;

			if(example.type==="test"){
				var eEditorModeArray = [];
				var testExercises = JSON.parse(example.exercises);
				//Infer editorMode
				for(var j=0; j<testExercises.length; j++){
					var testExercise = testExercises[j];
					if(eEditorModeArray.indexOf(testExercise.editorMode)===-1){
						eEditorModeArray.push(testExercise.editorMode);
					}
				}
				eEditorMode = eEditorModeArray.join(" ");
				eTitle = example.title + " (Test)";
			} else {
				//exercise
				eEditorMode = example.editorMode;
				eTitle = example.title;
			}

			$(selector).append('<option group="'+ eEditorMode + '" value="'+ i.toString() +'">' + eTitle + '</option>');
			_examples[i] = example;
		}
	};

	var _loadExamples = function(editorMode){
		if(_editorModes.indexOf(editorMode)===-1){
			editorMode = _currentEditorMode;
		}
		$("#examples_panel #examples_selection option").removeAttr("selected").hide();
		$("#examples_panel #examples_selection option[group*='" + editorMode + "']").show();
		$($("#examples_panel #examples_selection option[group*='" + editorMode + "']")[0]).attr("selected","selected");
	};

	var getCurrentViewMode = function(){
		return _currentViewMode;
	};

	var getCurrentEditorMode = function(){
		return _currentEditorMode;
	};

	var getCurrentEditorTheme = function(){
		return _currentEditorTheme;
	};

	var getEditor = function(){
		return _editor;
	};

	var getCurrentTest = function(){
		return _currentTest;
	};

	var getCurrentExercise = function(){
		return _currentExercise;
	};

	var _initEditor = function(options){
		_editor = ace.edit("editor");

		//Specify Default values
		_changeEditorMode(_editorModes[1]);
		_changeEditorTheme(_editorThemes[0]);

		document.getElementById('editor').style.fontSize='14px';
		_editor.setShowPrintMargin(false);

		_focusEditor();
	};

	var _focusEditor = function(){
		if(typeof _editor !== "undefined"){
			_editor.focus();
			var _editorSession = _editor.getSession();
			//Get the number of lines
			var _count = _editorSession.getLength();
			//Go to end of the last line
			_editor.gotoLine(_count, _editorSession.getLine(_count-1).length);
		}
	};

	var _loadEvents = function(){
		window.onresize = function(event){
			CODEditor.UI.adjustView();
			if(typeof _currentExercise !== "undefined"){
				if(_currentExercise.editorMode === "HTML"){
					CODEditor.HTML.adjustHTMLPreviewUI();
				}
			}
		};

		$("ul.menu > li[group='view']").click(function(){
			$("ul.menu li[group=view]").removeClass("active");
			$(this).addClass("active");
			_changeViewMode($(this).attr("viewMode"));
		});

		$("#settings").click(function(e){
			if($(this).hasClass("active")){
				$(this).removeClass("active");
				$("#settings_panel").hide();
			} else {
				$(this).addClass("active");
				$("#settings_panel").show();
			}
		});

		$("#examples").click(function(e){
			if($(this).hasClass("active")){
				$(this).removeClass("active");
				$("#examples_panel").hide();
			} else {
				$("#examples_panel #examples_mode option[value='"+CODEditor.CORE.getCurrentEditorMode()+"']").attr("selected","selected");
				_loadExamples();
				$(this).addClass("active");
				$("#examples_panel").show();
			}
		});

		$("#editorModeMenu").click(function(){
			$("#settings").trigger("click");
		});

		$("#closeSettingsButton").click(function(){
			$("#settings").removeClass("active");
			$("#settings_panel").hide();
		});

		$("#closeExamplesButton").click(function(){
			$("#examples").removeClass("active");
			$("#examples_panel").hide();
		});

		$("#settings_fontsize").change(function(event) {
			var newFontsize = $(this).val();
			document.getElementById('editor').style.fontSize=newFontsize;
		});

		$("#settings_mode").change(function(event) {
			var newEditorMode = $(this).val();
			_changeEditorMode(newEditorMode);
		});

		$("#examples_mode").change(function(event) {
			_loadExamples($(this).val());
		});

		$("#settings_theme").change(function(event) {
			var newTheme = $(this).val();
			_changeEditorTheme(newTheme);
		});

		$("#run").click(function(){
			_runCode();
		});

		$("#open").click(function(){
			_openFile();		
		});

		$("#save").click(function(){
			_saveFile();
		});

		$("#refresh").click(function(){
			if(typeof _currentExercise != "undefined"){
				var r = confirm("Si recargas el ejercicio perderás todos tus cambios. ¿Estás seguro de que deseas hacerlo?");
				if (r === true) {
					_loadJSON(_currentExercise);
					CODEditor.UI.cleanPreview();
				}
			} else {
				CODEditor.Utils.showDialog("No hay ningún ejercicio que reiniciar.");
			}
		});

		$("#loadExample").click(function(){
			//Load current example
			var exampleToLoad = $("#examples_panel #examples_selection").val();
			if(typeof _examples[exampleToLoad] !== "undefined"){
				if(_isValidJSON(_examples[exampleToLoad])){
					$("#examples").trigger("click");
					_loadJSON(_examples[exampleToLoad]);
				}
			}
		});

		$("#test_menu_wrapper").click(function(){
			var dialogDOM = $("#test_exercises_dialog");
			$(dialogDOM).attr("Title",_currentTest.title);

			var dialogWidth = 400;
			var dialogHeight = "auto";

			$(dialogDOM).dialog({
				autoOpen: true,
				dialogClass:'testMenuWrapper',
				closeOnEscape: true,
				resizable: false,
				draggable: false,
				width: dialogWidth,
				height: dialogHeight,
				modal: true,
				position: {my: "left top", at: "left bottom", of: "#test_menu_wrapper"},
				open: function(event, ui) {
					//Close dialog when click outside
					$('.ui-widget-overlay').bind('click', function(){ 
						$(dialogDOM).dialog('close'); 
					});
				},
				close: function(event, ui){
					$("#test_menu_wrapper > div").removeClass("open");
					// $(this).empty().dialog('destroy');
					$(this).dialog('destroy');
				}
			});

			//Add some extra top margin.
			var newDialogDOM = $(".testMenuWrapper");
			$(newDialogDOM).css("margin-top", $(newDialogDOM).cssNumber("margin-top") + 10 + "px");

			addArrowToDialog(newDialogDOM,"top");

			$("#test_menu_wrapper > div").addClass("open");

			return false;
		});

		$("#openurl").click(function(){
			if($(this).attr("disabled")!=="disabled"){

				var dialogDOM = $("#file_url_dialog");
				$(dialogDOM).attr("Title","Cargar fichero de Internet");

				var dialogWidth = 400;
				var dialogHeight = "auto";

				$(dialogDOM).dialog({
					autoOpen: true,
					dialogClass:'file_url_dialog',
					closeOnEscape: true,
					resizable: false,
					draggable: false,
					width: dialogWidth,
					height: dialogHeight,
					modal: true,
					open: function(event, ui) {
						//Close dialog when click outside
						$('.ui-widget-overlay').bind('click', function(){
							$(dialogDOM).dialog('close'); 
						});
					},
					close: function(event, ui){
						$(dialogDOM).find("input").val("");
						$(this).dialog('destroy');
					}
				});
			}
		});

		$("#file_url_dialog .codeditor_button").click(function(){
			var input = $("#file_url_dialog").find("input");
			var fileURL = $(input).val();
			var dialogDOM = $("#file_url_dialog");
			$(dialogDOM).dialog('close');
			_onGetExternalJSONFile(fileURL);
		});

		$("#exit").click(function(){
			if(typeof _currentExercise !== "undefined"){
				var r = confirm("Si abandonas el ejercicio perderás todos tus cambios. ¿Estás seguro de que deseas hacerlo?");
				if (r === true) {
					_exitFromCurrentExercise();
				}
			}
		});
	};

	var addArrowToDialog = function(dialogDOM, position){
		//Remove old arrows
		$(dialogDOM).find(".dialog_arrow").remove();

		var arrowDOM = $('<div class="dialog_arrow"></div>');
		var arrowShape = $('<div class="arrow_shape"></div>');
		$(arrowDOM).prepend(arrowShape);

		if(position==="top"){
			$(arrowShape).addClass("arrow-top");
		} else {
			$(arrowShape).addClass("arrow-bottom");
		}

		$(dialogDOM).prepend(arrowDOM);

		var arrowLeft = ($("#test_menu_wrapper").offset().left - $(dialogDOM).offset().left) + 10;
		$(arrowDOM).css("left",arrowLeft);
	};

	//Read params when load the editor
	var _readParams = function(){
		var params = {};
		try {
			var location = window.location;
			if(typeof location === "undefined"){
				return params;
			}
			var URLparams = location.search;
			URLparams = URLparams.substr(1,URLparams.length-1);
			var URLparamsArray = URLparams.split("&");
			for(var i=0; i<URLparamsArray.length; i++){
				try {
					var paramData = URLparamsArray[i].split("=");
					params[paramData[0]] = paramData[1];
				} catch(e){}
			}
		} catch (e) {}

		return params;
	};

	var _openFile = function(){
		//FileReader API support (doc at https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
		var isFileReaderSupported = false;
		try {
			if(window.File && window.FileReader && window.FileList && window.Blob){
				isFileReaderSupported = true;
			}
		} catch (e) {}

		if(!isFileReaderSupported){
			return CODEditor.Utils.showDialog("Lo siento, tu navegador no puede leer ficheros.");
		}

		var fileInput = document.getElementById('openFileInput');
		fileInput.addEventListener('change', _fileHandler);
	};

	var _fileHandler = function(){
		var fileInput = document.getElementById('openFileInput');
		var file = fileInput.files[0];
		var fileType = _isValidFileType(file);

		if (fileType!==false) {
			var reader = new FileReader();

			reader.onload = function(e){
				_resetFileHandler(fileInput);
				_processFile(reader.result,fileType);
			}

			reader.onerror = function(e){
				_resetFileHandler(fileInput);
				CODEditor.Utils.showDialog("Se produjo un error leyendo el fichero.");
			}

			reader.readAsText(file);
		} else {
			_resetFileHandler(fileInput);
			CODEditor.Utils.showDialog("Formato de fichero no soportado.");
		}
	};

	var _resetFileHandler = function(fileInput){
		fileInput.removeEventListener('change', _fileHandler);
		$(fileInput).val("");
		fileInput.addEventListener('change', _fileHandler);
	};

	var _isValidFileType = function(file){
		var fileType = file.type;

		if(typeof fileType !== "string"){
			return false;
		}

		var acceptedTypes = ["text/html","application/javascript","application/json","text/plain",/text.*/];

		for(var i=0; i<acceptedTypes.length; i++){
			if(fileType.match(acceptedTypes[i])){
				return acceptedTypes[i];
			}
		}

		//Look for JSON files
		if(fileType.trim()===""){
			if(file.name.match(/[aA-zZ0-9-]+\.json$/)){
				//fileName ends with ".json"
				return "application/json";
			}
		}

		return false;
	};

	//Get external file from fileURL
	var _getExternalJSONFile = function(fileURL,successCallback,failCallback){
		if(typeof fileURL !== "string"){
			return;
		}
		
		$.getJSON(fileURL, function(data){
			if(typeof successCallback == "function"){
				successCallback(data);
			}
		}).error(function(jqXHR,textStatus,errorThrown){
			if(typeof failCallback == "function"){
				failCallback(jqXHR,textStatus,errorThrown);
			}
		}).complete(function(){
		});
	};

	var _processFile = function(fileContent,fileType){
		if(typeof fileContent !== "string"){
			return CODEditor.Utils.showDialog("Formato de fichero no soportado.");
		}

		//Look for valid JSON
		if ((fileType==="application/json")||(fileType==="text/plain")||(fileType.toString()==="/text.*/")){
			if(_containsValidJSON(fileContent)){
				return _loadJSON(JSON.parse(fileContent));
			}
		}

		var editorContent = undefined;

		if(fileType==="text/html"){
			//HTML file
			_changeEditorMode("HTML");
		} else if (fileType==="application/javascript"){
			//JS file.
			_changeEditorMode("JavaScript");
			return true;
		} else if ((fileType==="text/plain")||(fileType.toString()==="/text.*/")){
			//Text files. Load as HTML file.
			_changeEditorMode("HTML");
		} else {
			//Unknown file.
			_changeEditorMode("HTML");
		}

		_editor.setValue(fileContent,1);
		_focusEditor();
	};

	var _containsValidJSON = function(fileContent){
		try{
			fileContent = JSON.parse(fileContent);
			if(_isValidJSON(fileContent)){
				return true;
			}
		} catch (e) {}
		return false;
	};

	var _saveFile = function(){
		var isFileSaverSupported = false;
		try {
			isFileSaverSupported = !!new Blob;
		} catch (e) {}

		if(!isFileSaverSupported){
			CODEditor.Utils.showDialog("Lo siento, tu navegador no puede descargar ficheros.");
		}

		var filename = "file.txt";
		switch(_currentEditorMode){
			case "HTML":
				filename = "index.html";
				break;
			case "JavaScript":
				filename = "script.js";
				break;
			default:
				return;
		}

		var dataToDownload = _editor.getValue();
		var blob = new Blob([dataToDownload], {type: "text/plain;charset=utf-8"});
		saveAs(blob, filename);
	};

	var _changeViewMode = function(viewMode){
		if((_viewModes.indexOf(viewMode)!=-1)&&(viewMode!=_currentViewMode)){
			var wrappersDOM = $("#editor_wrapper, #preview_wrapper");
			for(var i in _viewModes){
				if(viewMode === _viewModes[i]){
					_currentViewMode = viewMode;
					$(wrappersDOM).addClass(viewMode);
					$("ul.menu > li[group='view'][viewMode='"+viewMode+"']").addClass("active");
				} else {
					$(wrappersDOM).removeClass(_viewModes[i]);
					$("ul.menu > li[group='view'][viewMode='"+_viewModes[i]+"']").removeClass("active");
				}
			};
			if(typeof _editor != "undefined"){
				_editor.resize();
			}
			CODEditor.UI.adjustView();
		}
	};

	var _changeEditorMode = function(editorMode,isNew){
		if((_editorModes.indexOf(editorMode)!=-1)&&(editorMode!=_currentEditorMode)){

			var wrappersDOM = $("#editor_wrapper, #preview_wrapper");
			$(wrappersDOM).addClass(_currentEditorMode);

			$("#preview_wrapper #preview_header").html("");
			$("#preview_wrapper #preview").html("");

			for(var i in _editorModes){
				if(editorMode === _editorModes[i]){
					_currentEditorMode = editorMode;
					$(wrappersDOM).addClass(editorMode);
					$("#editorModeMenu").html(editorMode);
				} else {
					$(wrappersDOM).removeClass(_editorModes[i]);
				}
			};

			if(typeof _editor != "undefined"){
				isNew = !(isNew===false);
				var aceMode;
				var initialValue = "";

				switch(editorMode){
					case "HTML":
						aceMode = "ace/mode/html";
						initialValue = "<html>\n  <head></head>\n  <body>\n    \n  </body>\n</html>"
						$("#editor_tab p").html("index.html");
						$("#preview_wrapper.HTML #preview_header").html("<p>Resultado</p>");
						break;
					case "JavaScript":
						aceMode = "ace/mode/javascript";
						$("#editor_tab p").html("script.js");
						$("#preview_wrapper.JavaScript #preview_header").html("<p>Consola</p><div id='consoleButtons'><img id='closeJSconsole' title='Cerrar consola' src='img/close_console.png'/></div>");
						$("#closeJSconsole").click(function(){
							_changeViewMode("CODE");
						});
						break;
					default:
						return;
				}
				if(typeof aceMode == "string"){
					_editor.getSession().setMode(aceMode);
					if(isNew){
						_editor.setValue(initialValue,1);
					}
				}
			}

			CODEditor.UI.updateSettingsPanel();
		}
	};

	var _changeEditorTheme = function(editorTheme){
		if((_editorThemes.indexOf(editorTheme)!=-1)&&(editorTheme!=_currentEditorTheme)){

			$("body").removeAttr("theme");

			for(var i in _editorThemes){
				if(editorTheme === _editorThemes[i]){
					_currentEditorTheme = editorTheme;
					$("body").attr("theme",editorTheme);
				}
			};

			if(typeof editor != "undefined"){
				var aceTheme;
				switch(editorTheme){
					case "Chrome":
						aceTheme = "ace/theme/chrome";
						break;
					case "Twilight":
						aceTheme = "ace/theme/twilight";
						break;
					default:
						return;
				}
				if(typeof aceTheme == "string"){
					_editor.setTheme(aceTheme);
				}
			}
		}
	};

	var _runCode = function(){
		if(typeof _editor == "undefined"){
			return;
		}

		CODEditor.UI.cleanPreview();

		var code = _editor.getValue();

		if(_currentViewMode === "CODE"){
			_changeViewMode("HYBRID");
		}

		switch(_currentEditorMode){
			case "HTML":
				return CODEditor.HTML.runHTMLcode(code);
			case "JavaScript":
				return CODEditor.JS.runJavaScriptcode(code);
			default:
				return;
		}
	};

	var _loadJSON = function(json){
		var errors = _validateJSON(json);

		if(errors.length > 0){
			errors.unshift("El elemento a cargar no es válido.\n\nErrores:");
			var errorMessage = errors.join("\n");
			return CODEditor.Utils.showDialog(errorMessage);
		}

		switch(json.type){
			case "exercise":
				return _loadExercise(json);
			case "test":
				return _loadTest(json);
			default:
				return CODEditor.Utils.showDialog("El elemento a cargar no es válido.");
		}
	};

	var _loadTest = function(json){
		var exerciseDOM = $("#exercise_wrapper");
		$(exerciseDOM).addClass("open");


		//Load test header
		$("#test_header").css("display","inline-block");
		
		//Load title
		var testTitle = ("#test_title");
		$(testTitle).html(json.title);

		var testMenuWrapper = $("#test_menu_wrapper");
		$(testMenuWrapper).css("display","inline-block");

		_loadNextTestExercise();

		//Populate MenuWrapper
		CODEditor.UI.updateTestMenuDialog();
	};

	var _loadExercise = function(json){
		var exerciseDOM = $("#exercise_wrapper")
		$(exerciseDOM).addClass("open");

		//Load title
		var exerciseTitleDOM = $("#exercise_title");
		if(json.title){
			$(exerciseTitleDOM).html(json.title);
			$(exerciseTitleDOM).show();
		} else {
			$(exerciseTitleDOM).hide();
		}

		//Load description
		if(typeof json.description === "string"){
			json.description = CODEditor.Utils.purgeTextString(json.description);
			//Look for code tags.
			json.description = json.description.replace(/&lt;code&gt;/g, '<pre class="code">');
			json.description = json.description.replace(/&lt;\/code&gt;/g, '</pre>');
			$("#exercise_description").show();
			$("#exercise_description").html("<pre>" + json.description + "</pre>");
		} else {
			$("#exercise_description").hide();
		}

		//Editor mode
		_changeEditorMode(json.editorMode,false);

		//Block editorMode in settings
		$("#settings_mode").attr("disabled","disabled");

		//Show exercises group in toolbar
		$("ul.menu li[group='exercise']").css("display","inline-block");

		if(_isDefaultMode!==true){
			//Disallow loading
			$("#openFileInput").attr("disabled","disabled");
			$("label[for=openFileInput]").attr("disabled","disabled");
			$("#openurl").attr("disabled","disabled");
		} else {
			//Show exit feature
			$("ul.menu li[group*='exercise']").css("display","inline-block");
		}

		CODEditor.UI.cleanPreview();

		if(typeof json.content == "string"){
			_editor.setValue(json.content,1);
		}
		
		CODEditor.UI.adjustView();

		if(typeof _currentTest != "undefined"){
			CODEditor.UI.updateUIAfterNewExerciseOnTest();
		}
	};

	var _isValidJSON = function(json){
		return (_validateJSON(json,false).length===0);
	};

	var _validateJSON = function(json,updateCurrent){
		var errors = [];

		if(typeof json !== "object"){
			return errors.push("Invalid json. Is not an object.");
		}

		if((typeof json.type !== "string")||(["exercise","test"].indexOf(json.type)===-1)){
			return errors.push("Invalid 'type' value.");
		}

		switch(json.type){
			case "exercise":
				return _validateExercise(json,updateCurrent);
			case "test":
				return _validateTest(json,updateCurrent);
			default:
				return errors.push("Invalid 'type' value.");
		}
	};

	var _validateTest = function(json,updateCurrentTest){
		var errors = [];

		if(typeof json !== "object"){
			return errors.push("Invalid json. Is not an object.");
		}
		if(json.type !== "test"){
			errors.push("Type is not 'test'.");
		}
		if(typeof json.title !== "string"){
			errors.push("Invalid title.");
		}

		var validExercises = true;
		try {
			var exercises = JSON.parse(json.exercises);		
		} catch(e) {
			errors.push("Invalid exercises.");
			validExercises = false;
		}

		//Continue with the exercises validation
		if(validExercises){
			if(!(exercises instanceof Array)){
				errors.push("Invalid exercises.");
				validExercises = false;
			} else {
				if(exercises.length < 1){
					errors.push("There are no exercises.");
				} else {
					for(var i=0; i<exercises.length; i++){
						if(!_isValidJSON(exercises[i])){
							errors.push("Exercise not valid found.");
							break;
						}
					}
				}
			}
		}

		updateCurrentTest = !(updateCurrentTest===false);
		
		if((errors.length===0)&&(updateCurrentTest)){
			_currentTest = json;
			_currentTest.exercisesQuantity = exercises.length;
			_currentTest.currentExerciseIndex = 0;
			_currentTest.parsed_exercises = exercises;
			for(var j=0; j<_currentTest.parsed_exercises.length; j++){
				_currentTest.parsed_exercises[j].progress = {
					score: 0,
					passed: false
				}
			}
		}

		return errors;
	};

	var _validateExercise = function(json,updateCurrentExercise){
		var errors = [];

		if(typeof json !== "object"){
			return errors.push("Invalid json. Is not an object.");
		}
		if(json.type !== "exercise"){
			errors.push("Type is not 'exercise'.");
		}
		if((typeof json.editorMode !== "string")||(_editorModes.indexOf(json.editorMode)===-1)){
			errors.push("Invalid editorMode.");
		}
		if(typeof json.description !== "undefined"){
			if(typeof json.description !== "string"){
				errors.push("Invalid description.");
			}
		}
		if(typeof json.content !== "undefined"){
			if(typeof json.content !== "string"){
				errors.push("Invalid content.");
			}
		}
		if(typeof json.score_function !== "undefined"){
			//score_function is provided
			if (typeof json.score_function !== "string"){
				errors.push("Invalid score function.");
			} else {
				//Check if score_function is well formed
				//The score_function is retrieved in the scoreFunctionEvaluation.response var.
				var scoreFunctionEvaluation = CODEditor.JS.validateScoreFunction(json.score_function);
				if(scoreFunctionEvaluation.errors.length > 0){
					for(var i=0; i<scoreFunctionEvaluation.errors.length; i++){
						errors.push(scoreFunctionEvaluation.errors[i]);
					}
				} else {
					if(typeof scoreFunctionEvaluation.response !== "function"){
						errors.push("The score function is not a function.");
					} else {
						//Check if scoreFunction returns a valid score.
						//score should be a number, or a object like {*score: {number}, errors: [], feedback: []}

						var scoreFunctionVariablesHash = {};
						if(json.score_function_vars instanceof Array){
							for(var sfv=0; sfv<json.score_function_vars.length; sfv++){
								if(typeof json.score_function_vars[sfv] == "string"){
									scoreFunctionVariablesHash[json.score_function_vars[sfv]] = "";
								}
							}
						}

						try {
							var testScore = scoreFunctionEvaluation.response("",scoreFunctionVariablesHash);
							if(typeof testScore !== "number"){
								if(typeof testScore === "object"){
									if(typeof testScore.score !== "number"){
										errors.push("The score function returns an object with an invalid or missing 'score' field.");
									}
									if((typeof testScore.successes !== "undefined")&&(!testScore.successes instanceof Array)){
										errors.push("The score function returns an object with an invalid 'successes' array.");
									}
									if((typeof testScore.errors !== "undefined")&&(!testScore.errors instanceof Array)){
										errors.push("The score function returns an object with an invalid 'errors' array.");
									}
									if((typeof testScore.feedback !== "undefined")&&(!testScore.feedback instanceof Array)){
										errors.push("The score function returns an object with an invalid 'feedback' array.");
									}
								} else {
									errors.push("The score function returns an invalid value.");
								}
							} else {
								//Score is a number. Do nothing.
							}
						} catch(e) {
							errors.push("Exception raised in score function: " + e.message);
						}
					}
				}
			}
		}

		updateCurrentExercise = !(updateCurrentExercise===false);
		
		if((errors.length===0)&&(updateCurrentExercise)){
			_currentExercise = json;
			if(typeof json.score_function !== "undefined"){
				_currentExercise.parsed_score_function = scoreFunctionEvaluation.response;
			}
		}

		return errors;
	};

	var _exitFromCurrentExercise = function(){
		if(typeof _currentExercise === "undefined"){
			return;
		}

		_currentExercise = undefined;
		_currentTest = undefined;

		var exerciseDOM = $("#exercise_wrapper")
		$(exerciseDOM).removeClass("open");

		//Unload title
		var exerciseTitleDOM = $("#exercise_title");
		$(exerciseTitleDOM).hide();

		//Unload description
		$("#exercise_description").hide();

		//Unblock editorMode in settings
		$("#settings_mode").removeAttr("disabled");

		//Hide exercises group in toolbar
		$("ul.menu li[group*='exercise']").css("display","none");

		if(_isDefaultMode!==true){
			//Allow loading
			$("#openFileInput").removeAttr("disabled");
			$("label[for=openFileInput]").removeAttr("disabled");
			$("#openurl").removeAttr("disabled");
		}

		CODEditor.UI.cleanPreview();

		//Reset editor
		_editorModeToSet = _currentEditorMode;
		_currentEditorMode = undefined;
		_changeEditorMode(_editorModeToSet,true);
		
		CODEditor.UI.adjustView();
	};


	//Test management

	var _hasNextExercise = function(){
		return ((typeof _currentTest != "undefined")&&( _currentTest.currentExerciseIndex < _currentTest.exercisesQuantity))
	};

	var _getNextExercise = function(){
		if(_hasNextExercise()){
			return _currentTest.parsed_exercises[_currentTest.currentExerciseIndex];
		} else {
			return undefined;
		}
	};

	var _loadNextTestExercise = function(){
		if(_hasNextExercise()){
			var exercise = _getNextExercise();
			_currentTest.currentExerciseIndex += 1;
			_loadJSON(exercise);
		}
	};

	var loadTestExercise = function(exerciseIndex){
		_currentTest.currentExerciseIndex = exerciseIndex;
		var excercise = _currentTest.parsed_exercises[_currentTest.currentExerciseIndex-1];
		_loadJSON(excercise);
		CODEditor.UI.updateTestMenuDialog();
	};

	var _isCurrentTestCompleted = function(){
		if(typeof _currentTest != "undefined"){
			for(var i=0; i<_currentTest.parsed_exercises.length; i++){
				if(_currentTest.parsed_exercises[i].progress.passed !== true){
					return false;
				}
			}
		} else {
			return false;
		}

		return true;
	};

	var onDoCurrentExercise = function(score,screenDOM){
		if(typeof _currentTest != "undefined"){
			if(typeof _currentExercise != "undefined"){

				if(typeof _currentExercise.parsed_score_function != "function"){
					//Non graded exercise
					_currentExercise.progress.passed = true;
				} else {
					//Exercise with grading
					score = (typeof score === "number") ? score : 0;

					if(score >= 5){
						_currentExercise.progress.passed = true;

						if((_hasNextExercise())&&(!_getNextExercise().progress.passed)){
							var nextExerciseWrapper = $("<div class='nextExerciseButtonWrapper'><div class='nextExerciseButton'>Iniciar siguiente ejercicio</div></div>");
							if(typeof _currentExercise.parsed_score_function == "function"){
								$(screenDOM).find("div.overall_score").after(nextExerciseWrapper);
							}
							
							$(screenDOM).find(".nextExerciseButton").click(function(){
								_loadNextTestExercise();
							});
						} else {
							var testCompleted = _isCurrentTestCompleted();
							var messageWrapper;

							if(testCompleted){
								messageWrapper = $("<div class='nextExerciseButtonWrapper'><div class='nextExerciseButton'>¡Enhorabuena, has completado el test '" + _currentTest.title + "'!</div></div>");
							} else {
								messageWrapper = $("<div class='nextExerciseButtonWrapper'><div class='nextExerciseButton'>Ver más ejercicios</div></div>");
							}

							if(typeof _currentExercise.parsed_score_function == "function"){
								$(screenDOM).find("div.overall_score").after(messageWrapper);
							}

							if(!testCompleted){
								$(screenDOM).find(".nextExerciseButton").click(function(){
									$("#test_menu_wrapper").trigger("click");
								});
							}
						}
					}
				}

				CODEditor.UI.updateTestMenuDialog();
			}
		}
	};

	return {
		init 					: init,
		getCurrentViewMode		: getCurrentViewMode,
		getCurrentEditorMode 	: getCurrentEditorMode,
		getCurrentEditorTheme	: getCurrentEditorTheme,
		getEditor 				: getEditor,
		getCurrentExercise 		: getCurrentExercise,
		getCurrentTest			: getCurrentTest,
		loadTestExercise		: loadTestExercise,
		onDoCurrentExercise		: onDoCurrentExercise
	};

}) (CODEditor,jQuery);