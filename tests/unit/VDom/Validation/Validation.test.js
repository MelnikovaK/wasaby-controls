define([
   'Core/helpers/Function/runDelayed',
   'Core/vdom/Synchronizer/Synchronizer'
], function (runDelayed, Synchronizer) {
   'use strict';

   var testNum = 1;

   var skipTests = []; //Пропустить тест
   var skipComponent = []; //Для тестов, которые сами создают контролы,
   // и для асинхронных тестов.
   // Аргументом в функцию проверки передается done

   describe('Validation-tests', function () {
      var testControl;
      beforeEach(function () {
         if (typeof $ === 'undefined') {//Проверка того, что тесты выполняются в браузере
            this.skip();
         }
         if (~skipTests.indexOf(testNum)) {
            testNum++;
            this.skip();
         }
         else {
            testNum++;
            $('#mocha').append('<div id="component123"></div>');//Для добавления верстки на страницу
         }
      });

      function check(done, control, expected, callback) {
         control.validate().addCallback(function(res) {
            try {
               assert.deepEqual(res, expected);
            } catch (e) {
               done(e);
               return;
            }

            callback();
         });
      }

      it('SimpleCase - Validation1 - single validator', function (done) {
         global.requirejs(['Core/Control', 'js!DemoComponents/Validation/Validation1/Validation1'], function (CoreControl, Component) {
            var element = $('#component123');
            testControl = CoreControl.createControl(Component, {element: element}, element);

            testControl._afterMount = function () {
               runDelayed(function() {
                  $(document).ready(function () {
                     setTimeout(function () { // ждем когда оживятся дети

                        testControl._children.validate._focusOutHandler();
                        runDelayed(function () { // ждем синхронизатор
                           runDelayed(function () { // ждем runDelayed из DOMEnvironment который нужен для reviveSuperOldControls
                              runDelayed(function () { // ждем когда пройдет валидация
                                 assert.deepEqual(testControl._children.textBox._options.validationError, [false]);

                                 testControl.setText('ya@ya.ya');
                                 runDelayed(function () { // ждем синхронизатор
                                    runDelayed(function () { // ждем runDelayed из DOMEnvironment который нужен для reviveSuperOldControls
                                       testControl._children.validate._focusOutHandler();
                                       runDelayed(function () { // ждем синхронизатор
                                          runDelayed(function () { // ждем runDelayed из DOMEnvironment который нужен для reviveSuperOldControls
                                             runDelayed(function () { // ждем когда пройдет валидация
                                                assert.deepEqual(testControl._children.textBox._options.validationError, true);
                                                done();
                                             });
                                          });
                                       });
                                    });
                                 });

                              });
                           });
                        });
                     }, 200);
                  });
               });
            };
         });
      });

      it('SimpleCase - Form1 - single validator', function (done) {
         global.requirejs(['Core/Control', 'js!DemoComponents/Validation/Form1/Form1'], function (CoreControl, Component) {
            var element = $('#component123');
            testControl = CoreControl.createControl(Component, {element: element}, element);

            testControl._afterMount = function () {
               runDelayed(function() {
                  $(document).ready(function () {
                     setTimeout(function () { // ждем когда оживятся дети
                        check(done, testControl, {0: [false] }, function () {
                           testControl._afterUpdate = function () {
                              check(done, testControl, {0: true }, function () {
                                 done();
                              });
                           };
                           testControl.setText('ya@ya.ya');
                        });
                     }, 200);
                  });
               });
            };
         });
      });

      it('SimpleCase - Form2 - multiple validators', function (done) {
         global.requirejs(['Core/Control', 'js!DemoComponents/Validation/Form2/Form2'], function (CoreControl, Component) {
            var element = $('#component123');
            testControl = CoreControl.createControl(Component, {element: element}, element);

            testControl._afterMount = function () {
               runDelayed(function() {
                  $(document).ready(function () {
                     setTimeout(function () { // ждем когда оживятся дети
                        check(done, testControl, {0: [false, "IsRequiredDef: undefined не является строкой"] }, function () {
                           testControl._afterUpdate = function () {
                              check(done, testControl, {0: [false, "IsRequiredDef: пустая строка"] }, function () {
                                 testControl._afterUpdate = function () {
                                    check(done, testControl, {0: [false] }, function () {
                                       testControl._afterUpdate = function () {
                                          check(done, testControl, {0: true }, function () {
                                             done();
                                          });
                                       };
                                       testControl.setText('ya@ya.ya');
                                    });
                                 };
                                 testControl.setText('123');
                              });
                           };
                           testControl.setText('');
                        });
                     }, 200);
                  });
               });
            };
         });
      });

      afterEach(function () {
         testControl.__$destroyFromDirtyChecking = true;
         if (testControl._children.Form) {
            testControl._children.Form.__$destroyFromDirtyChecking = true;
         }
         if (testControl._children.validate) {
            testControl._children.validate.__$destroyFromDirtyChecking = true;
         }
         testControl && testControl.destroy();
      });
   });

});