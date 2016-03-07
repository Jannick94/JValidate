/**
* JValidate
* Simple and easy to use validation plugin inspired by Laravel validation.
* @author Jannick Berkhout
* @collaborators Martijn de Ridder, Mace Muilman
* @version 0.2.4
* @last-updated 07-03-2016
*/

jQuery(function($) {

	'use strict';

	$.fn.jvalidate = function(options) {

		/* Plugin's default settings */
		var settings = $.extend({
			errorMessage: false,
			validationDelay: 400,
			debug: false,
			onRemoteDone: function() {}
		}, options);

		/* Variable declarations */
		var validation,
			input,
			elem,
			args,
			form,
			switchCase,
			messageLocale,
			isValid,
			validationValue,
			validationDelay,
			validationMessage,
			validationRemote,
			elements = [],
			remoteElem,
			remoteArgs,
			remoteCase,
			tabKey,
			checkboxCount,
			parsedArgs,
			parsedVal,
			extension,
			extensionKey,
			extensions;

		var delay = (function(){
			var timer = 0;
			return function(callback, ms){
				clearTimeout (timer);
				timer = setTimeout(callback, ms);
			};
		})();

		/* Store form in form variable */
		form = this;

		/* Serialize the form */
		form.serialize();

		/* Find every input the form has */
		form.find('[data-validate]').each(function(key, element) {

			/* Store the input element in cache */
			input = $(element);

			/* On keyup and blur start the validation */
			input.on('keyup blur change', function(e) {

				tabKey  = e.which;
				isValid = true;

				if (tabKey == 0 || tabKey == 9) {
					return;
				}

				/* Store all set validation rules to array */
				/* Example use: <input type="text" data-validation="required|min:3|max:10 */
				validation = $(this).data('validate').split('|');

				/* Store the current element in elem for later use */
				/* Set autocomplete attribute to false to prevent Chrome adding autocomplete list */
				elem       = $(this);
				elem.attr('autocomplete', 'false');

				/* For each rule in validation array */
				$.each(validation, function(key, value) {

					/* Declare arguments as empty array */
					/* Split argument value on : and store them in validationValue */
					/* Store key in switchCase variable to use in switch case statement */
					args            = [];
					validationValue = value.split(/:(.+)?/);
					switchCase      = validationValue[0];

					/* If rule has arguments, store them in the args array */
					if (validationValue.length > 1) {
						args = validationValue[1];
					}

					if(isValid) {

						switch(switchCase) {
							case 'required':

								if ($.trim(elem.val()).length === 0) {
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid);

								break;

							case 'group':

								/*Argument with group case isn't required, make it optional if it's not set*/
								if (args.length < 1) {
									args = 1;
								}

								checkboxCount = elem.find('input[type="checkbox"]:checked, input[type="radio"]:checked').length;

								if (checkboxCount < args) {
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid, args);

								break;

							case 'iban':

								if(!IBAN.isValid(elem.val())) {
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid);

								break;

							case 'number':

								var re = /^\d+$/;
								if(!re.test(elem.val())) {
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid);

								break;

							case 'email':

								var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
								if(!re.test(elem.val())) {
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid);

								break;

							case 'regex':

								var pattern = new RegExp("["+ args +"]$","i");
								if(!pattern.test(elem.val())) {
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid);

								break;

							case 'minlength':

								if($.trim(elem.val()).length < args) {
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid, args);

								break;

							case 'maxlength':

								if($.trim(elem.val()).length > args) {
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid, args);

								break;

							case 'min':

								var parsedArgs = parseFloat(args);
								var parsedVal  = parseFloat(elem.val());

								if (parsedVal < parsedArgs) {
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid, args);

								break;

							case 'max':

								var parsedArgs = parseFloat(args);
								var parsedVal  = parseFloat(elem.val());

								if (parsedArgs !== NaN && parsedVal !== NaN) {
									if (parsedVal > parsedArgs) {
										isValid = false;
									}
								}

								addErrorMessage(elem, switchCase, isValid, args);

								break;

							case 'url':

								var re = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig

								if(!re.test(elem.val())) {
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid);

								break;

							case 'remote':

								/* HTML Attributes */
								/* data-validate="remote:[URL]", url to call via jQuery AJAX */
								/* data-validate-delay="[NUMBER]", time in milliseconds, this is to delay the ajax call so the URL doesn't get called every keyup */
								/* data-validate-valid="[STRING]", validate to compare result of ajax call to, if true, field is valid. */
								/* Usage example: <input type="text" data-validate="remote:/ajax/script.php" data-validate-valid="true" data-validate-delay="1000" */

								remoteCase       = switchCase;
								remoteElem       = elem;
								remoteArgs       = args;
								validationDelay  = elem.data('validate-delay') || settings.validationDelay;
								validationRemote = elem.data('validate-valid');

								if ($.trim(elem.val()).length !== 0) {

									delay(function() {

										$.ajax({
											url: remoteArgs,
											type: 'POST',
											data: { data: remoteElem.val() }
										}).done(function(data) {
											data = $.parseJSON(data);

											if (data !== validationRemote) {
												isValid = false;
												addErrorMessage(remoteElem, remoteCase, isValid);
												settings.onRemoteDone(data);
											} else {
												isValid = true;
												addErrorMessage(remoteElem, remoteCase, isValid);
												settings.onRemoteDone(data);
											}
										});
									}, validationDelay);

								} else {
									isValid = false;
								}

								break;

							case 'custom':

								if (!window[args]( elem.val())) {
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid);

							break;

							case 'same':

								var otherField = $(args);

								var fieldName1 = elem.data('name') || '';
								var fieldName2 = otherField.data('name') || '';

								if (elem.val() != otherField.val()){
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid, fieldName2);
								addErrorMessage(otherField, switchCase, isValid, fieldName1);

							break;

							case 'date':

								var format = args.toLowerCase();
								var dateString = $.trim(elem.val());
								var partsnumbers = new Array();

								if(format == 'dd-mm-yyyy') { if(!/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString)) { isValid = false; } else { var parts = dateString.split("-"); partsnumbers = [0,1,2]; } }
								else if(format == 'dd/mm/yyyy') { if(!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) { isValid = false; } else { var parts = dateString.split("/");  partsnumbers = [0,1,2]; } }
								else if(format == 'yyyy-mm-dd') { if(!/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)) { isValid = false; } else { var parts = dateString.split("-"); partsnumbers = [2,1,0]; } }
								else if(format == 'yyyy/mm/dd') { if(!/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateString)) { isValid = false; } else { var parts = dateString.split("/"); partsnumbers = [2,1,0]; } }

								if(isValid == true) {

									//Explode the date in parts of day, month and year
									var day = parseInt(parts[partsnumbers[0]], 10);
									var month = parseInt(parts[partsnumbers[1]], 10);
									var year = parseInt(parts[partsnumbers[2]], 10);

									// Check the ranges of month and year are likely to be ok
									if(year < 1000 || year > 3000 || month == 0 || month > 12) { isValid = false; } else {

										var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

										// Adjust for leap years
										if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) { monthLength[1] = 29; }

										// Check the range of the day
										if(day <= 0 || day > monthLength[month - 1]) { isValid = false; }

									}

								}

								addErrorMessage(elem, switchCase, isValid, args);

							break;

							case 'file':

								//if files array has been set
								if (elem[0].files.length > 0) {

									extensions   = args.split(',');
									extension    = elem[0].files[0].name;
									extensionKey = extension.lastIndexOf('.');

									if (extensionKey != -1) {
									    extension = extension.substr(extensionKey);
									    if (extension.charAt(0) === '.') {
									    	extension = extension.substr(1);
									    }
									}

									if (extensions.indexOf(extension) === -1) {
										isValid = false;
									}

								} else {
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid);

								break;
							default:
							//Default
							break;

						}

					}

				});
			});

		});

		function addErrorMessage(elem, type, valid, args) {

			/* Make args optional by setting is undefined if not passed to function */
			args = args || undefined;

			/* Check if element that is passed to function is valid */
			if (!valid) {

				elem.addClass('has-error').removeClass('is-valid');

				/* Check if plugin setting is set to true */
				if(settings.errorMessage) {

					/* Prevent message to be added multiple times by checking the length */
					if (!elem.siblings('span.jvalidate-error-message').length > 0) {

						/* If args is not undefined, get the message from locale file and replace %arg% with arguments that are passed to function */
						/* Example use   : 'min': 'This field needs a minimal length of %arg%' characters */
						/* Example output: 'This field need a minimal of 5 characters' */
						if (args !== undefined) {
							try {
								messageLocale = messages[type].replace('%arg%', args)
							} catch(err) {
								messageLocale = messages['default'];
							}
						} else {
							messageLocale = messages[type];
						}

						/* Validation message can be set as an HTML attribute to overwrite defaults in locale file. */
						/* Example use: <input type="text" data-validation="required" data-validation-message="This field is required, please fill in a value"> */
						/* Else if no attribute is set in HTML, use the default locale message */
						validationMessage = elem.data('validate-message') || messageLocale;

						/* Create a span element with the HTML of the validation message and insert it after the input in the DOM */
						$('<span />', {
							class: 'text-danger jvalidate-error-message',
							text: validationMessage
						}).insertAfter(elem);

					}
				}

			} else if (valid) {
				/* If the input passes the validation, remove the error message */
				elem.siblings('span.jvalidate-error-message').remove();
				elem.removeClass('has-error').addClass('is-valid');
			}
		}

		form.on('submit', function(e) {

			elements = [];

			form.find('[data-validate]').each(function(key, value) {
				$(value).trigger('keyup');
				elements.push(isValid);
			});

			/*On submit find first input with error and focus the input*/
			$('[data-validate].has-error:first').focus();

			if (settings.debug) {
				e.preventDefault();
				console.debug('Debug: on | Submit always canceled');
				console.debug('Boolean array of form:  ' + elements);
			}

			if (!elements.every(Boolean)) {
				e.preventDefault();
			}

		});

	};

}(jQuery));
