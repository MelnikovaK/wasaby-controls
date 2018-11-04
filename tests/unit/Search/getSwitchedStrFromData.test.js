define(['Controls/Search/MissSpell/getSwitcherStrFromData', 'WS.Data/Collection/RecordSet', 'WS.Data/Entity/Model'], function(getSwitchedStrFromData, RecordSet, Model) {
   
   describe('Controls.Search.MissSpell.getSwitchedStrFromData', function() {
      
      it('getSwitchedStrFromData', function() {
         var rs = new RecordSet({
            rawData: [],
            idProperty: 'id'
         });
         rs.setMetaData({
            results: new Model({
               rawData: {
                  switchedStr: 'testStr'
               }
            })
         });
         assert.equal(getSwitchedStrFromData(rs), 'testStr');
      });
   });
   
});