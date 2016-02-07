/**
* JValidate
* Simple and easy to use validation plugin inspired by Laravel validation.
* @author Jannick Berkhout
* @collaborators Martijn de Ridder, Mace Muilman
* @version 0.1
* @last-updated 06-02-2016
*/

$(function() {

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
			remoteCase;

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
		form.find('input').each(function(key, element) {

			/* Store the input element in cache */
			input = $(element);

			/* On keyup and blur start the validation */
			input.on('keyup blur change', function() {

				isValid = true;

				/* Store all set validation rules to array */
				/* Example use: <input type="text" data-validation="required|min:3|max:10 */
				validation = $(this).data('validation').split('|');

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

									elem.addClass('has-error').removeClass('is-valid');
									isValid = false;

								} else {
									elem.removeClass('has-error').addClass('is-valid');
									isValid = true;
								}

								addErrorMessage(elem, switchCase, isValid);

								break;

							case 'iban':

								if(!IBAN.isValid(elem.val())) {
									elem.addClass('has-error').removeClass('is-valid');
									isValid = false;
								} else {
									elem.removeClass('has-error').addClass('is-valid');
									isValid = true;
								}

								addErrorMessage(elem, switchCase, isValid);

								break;

							case 'number':

								var re = /^\d+$/;
								if(!re.test(elem.val())) {
									elem.addClass('has-error').removeClass('is-valid');
									isValid = false;
								} else {
									elem.removeClass('has-error').addClass('is-valid');
									isValid = true;
								}

								addErrorMessage(elem, switchCase, isValid);

								break;

							case 'email':

								var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
								if(!re.test(elem.val())) {
									addErrorMessage(elem, switchCase);

									elem.addClass('has-error').removeClass('is-valid');
									isValid = false;
								} else {
									elem.removeClass('has-error').addClass('is-valid');
									isValid = true;
								}

								addErrorMessage(elem, switchCase, isValid);

								break;

							case 'regex':

								var pattern = new RegExp("["+ args +"]$","i");
								if(!pattern.test(elem.val())) {
									elem.addClass('has-error').removeClass('is-valid');
									isValid = false;
								} else {
									elem.removeClass('has-error').addClass('is-valid');
									isValid = true;
								}

								break;

							case 'min':

								if($.trim(elem.val()).length < args) {
									elem.addClass('has-error').removeClass('is-valid');
									isValid = false;
								} else {
									elem.removeClass('has-error').addClass('is-valid');
									isValid = true;
								}

								addErrorMessage(elem, switchCase, isValid, args);

								break;

							case 'max':

								if($.trim(elem.val()).length > args) {
									elem.addClass('has-error').removeClass('is-valid');
									isValid = false;
								} else {
									elem.removeClass('has-error').addClass('is-valid');
									isValid = true;
								}

								addErrorMessage(elem, switchCase, isValid, args);

								break;

							case 'url':

								var re = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig

								if(!re.test(elem.val())) {
									elem.addClass('has-error').removeClass('is-valid');
									isValid = false;
								} else {
									elem.removeClass('has-error').addClass('is-valid');
									isValid = true;
								}

								addErrorMessage(elem, switchCase, isValid);

								break;

							case 'remote':

								/* HTML Attributes */
								/* data-validation="remote:[URL]", url to call via jQuery AJAX */
								/* data-validation-delay="[NUMBER]", time in milliseconds, this is to delay the ajax call so the URL doesn't get called every keyup */
								/* data-validation-valid="[STRING]", validate to compare result of ajax call to, if true, field is valid. */
								/* Usage example: <input type="text" data-validation="remote:/ajax/script.php" data-validation-valid="true" data-validation-delay="1000" */

								remoteCase       = switchCase;
								remoteElem       = elem;
								remoteArgs       = args;
								validationDelay  = elem.data('validation-delay') || settings.validationDelay;
								validationRemote = elem.data('validation-valid');

								delay(function() {
									$.ajax({
										url: remoteArgs,
										type: 'POST',
										data: { data: remoteElem.val() }
									}).done(function(data) {
										data = $.parseJSON(data);

										if (data !== validationRemote) {
											remoteElem.addClass('has-error').removeClass('is-valid');
											console.log('ajax not passed');
											isValid = false;
											settings.onRemoteDone(data);
										} else {
											remoteElem.removeClass('has-error').addClass('is-valid');
											console.log('ajax passed');
											settings.onRemoteDone(data);
										}
									}).fail(function() {
										remoteElem.addClass('has-error').removeClass('is-valid');

									});
								}, validationDelay);

								addErrorMessage(remoteElem, remoteCase, isValid);

								break;

							case 'custom':

								if (window[args]( elem.val() )){
									elem.removeClass('has-error').addClass('is-valid');
								} else {
									elem.addClass('has-error').removeClass('is-valid');
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid);

							break;

							case 'same':

								var fieldName1 = elem.data('name') || '';
								var fieldName2 = $(args).data('name') || '';

								if (elem.val() == $(args).val()){
									elem.removeClass('has-error').addClass('is-valid');
									$(args).removeClass('has-error').addClass('is-valid');
								} else {
									elem.addClass('has-error').removeClass('is-valid');
									$(args).addClass('has-error').removeClass('is-valid');
									isValid = false;
								}

								addErrorMessage(elem, switchCase, isValid, fieldName2);
								addErrorMessage($(args), switchCase, isValid, fieldName1);

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

			/* Check if plugin setting is set to true */
			if(settings.errorMessage) {

				/* Check if element that is passed to function is valid */
				if (!valid) {

					/* Prevent message to be added multiple times by checking the length */
					if (!elem.siblings('span.jvalidate-error-message').length > 0) {

						/* If args is not undefined, get the message from locale file and replace %arg% with arguments that are passed to function */
						/* Example use   : 'min': 'This field needs a minimal length of %arg%' characters */
						/* Example output: 'This field need a minimal of 5 characters' */
						if (args !== undefined) {
							messageLocale = messages[type].replace('%arg%', args);
						} else {
							messageLocale = messages[type];
						}

						/* Validation message can be set as an HTML attribute to overwrite defaults in locale file. */
						/* Example use: <input type="text" data-validation="required" data-validation-message="This field is required, please fill in a value"> */
						/* Else if no attribute is set in HTML, use the default locale message */
						validationMessage = elem.data('validation-message') || messageLocale;

						/* Create a span element with the HTML of the validation message and insert it after the input in the DOM */
						$('<span />', {
							class: 'text-danger jvalidate-error-message',
							text: validationMessage
						}).insertAfter(elem);

					}

				} else if (valid) {
					/* If the input passes the validation, remove the error message */
					elem.siblings('span.jvalidate-error-message').remove();
				}

			}
		}

		form.on('submit', function(e) {

			elements = [];

			form.find('input').each(function(key, value) {
				$(value).trigger('blur');
				elements.push(isValid);
			});

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
