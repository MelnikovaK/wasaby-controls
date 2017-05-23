/* global define, beforeEach, afterEach, describe, context, it, assert, $ws */
define([
   'js!SBIS3.CONTROLS.Action.List.InteractiveMove',
   'js!SBIS3.CONTROLS.TreeView'
],
function (InteractiveMove, TreeView) {
   describe('js!SBIS3.CONTROLS.Action.List.InteractiveMove', function () {
      describe('$constructor', function () {
         it('should get option parentProperty from linked view', function () {
            var view = new TreeView({
                  parentProperty: 'parent',
               }),
               action = new InteractiveMove({
                  linkedObject: view
               });
            assert.equal(action._options.parentProperty, 'parent');
         });
         it('should get option nodeProperty from linked view', function () {
            var view = new TreeView({
                  nodeProperty: 'parent@'
               }),
               action = new InteractiveMove({
                  linkedObject: view
               });
            assert.equal(action._options.nodeProperty, 'parent@');
         });
         it('should not get option parentProperty from linked view', function () {
            var view = new TreeView({parentProperty: 'parent123'}),
               action = new InteractiveMove({
                  parentProperty: 'parent',
                  linkedObject: view
               });
            assert.equal(action._options.parentProperty, 'parent');
         });
         it('should not get option nodeProperty from linked view', function () {
            var view = new TreeView({nodeProperty: 'parent123'}),
               action = new InteractiveMove({
                  nodeProperty: 'parent@',
                  linkedObject: view
               });
            assert.equal(action._options.nodeProperty, 'parent@');
         });
      })
   });
});