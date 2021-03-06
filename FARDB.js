var RecordingHolder = function(recording) {
	return {
		Created:   (new Date).getTime(),
		Recording: recording,
		Name:      null,
		Starred:   false,
		Labels:    []
	};                      
}

var FARDB = {
	
	Put: function( recording ) {
		var recordingHolder = RecordingHolder(recording);
		
		FARDB.AddToIndex( recordingHolder.Created, 'AllRecordings' );
		
		localStorage.setItem( 'Recording_' + recordingHolder.Created , JSON.stringify( recordingHolder ) );
	},
	
	Save: function( recordingHolder ) {
		localStorage.setItem( 'Recording_' + recordingHolder.Created , JSON.stringify( recordingHolder ) );
	},
	
	Get: function( id ) {		
		return JSON.parse( localStorage.getItem( 'Recording_' + id ) );
	},
	
	Remove: function( id ) {
		var recordingHolder = FARDB.Get( id );
		
		// Remove from label indexes
		for ( i in recordingHolder.Labels ) {
			FARDB.RemoveFromIndex( id, 'Label_' + recordingHolder.Labels[i]);
		}
		
		// Remove from All and Star indexes
		FARDB.RemoveFromIndex( id, 'Starred' );
		FARDB.RemoveFromIndex( id, 'AllRecordings' );
		
		// remove row entirely
		localStorage.removeItem( 'Recording_' + id );
	},
	
	AddToIndex: function( id, indexName ) {
		var index = JSON.parse( localStorage.getItem(indexName) );
		if ( index == null ) {
			// index not initialised in localStorage, set it to an empty array
			index = [];
		} else {
			// make sure it isn't already in there
			if ( index.indexOf(id) !== -1 ) {
				return;
			}
		}
		index.push( id );
		localStorage.setItem( indexName, JSON.stringify( index ) );
	},
	
	RemoveFromIndex: function( id, indexName ) {
		var index = JSON.parse( localStorage.getItem(indexName) );
		if ( index == null ) {
			// index not initialised, nothing to do
			return;
		}
		var i = index.indexOf(id);
		if ( i == -1 ) {
			// not in the index, nothing to do
			return;
		}
		index.splice(i,1);
		
		// if the index is now empty, destroy it
		if ( index.length == 0 ) {
			localStorage.removeItem( indexName );
			
			// if the index was a label, remove it from the Labels index too
			if ( indexName.indexOf( 'Label_' ) == 0 ) {
				FARDB.RemoveFromIndex( indexName, 'Labels' );
			}
		} else {
			localStorage.setItem( indexName, JSON.stringify( index ) );
		}
	},
	
	Name: function( id, name ) {
		var recordingHolder = FARDB.Get( id );
		recordingHolder.Name = name;
		FARDB.Save( recordingHolder );
	},
	
	Clear: function() {
		localStorage.clear();
	},
	
	AddStar: function( id ) {
		var recordingHolder = FARDB.Get( id );
		recordingHolder.Starred = true;
		FARDB.Save( recordingHolder );
		FARDB.AddToIndex( id, 'Starred' );
	},
	
	RemoveStar: function( id ) {
		var recordingHolder = FARDB.Get( id );
		recordingHolder.Starred = false;
		FARDB.Save( recordingHolder );
		FARDB.RemoveFromIndex( id, 'Starred' );
	},	
	
	AddLabel: function( id, label ) {
		var recordingHolder = FARDB.Get( id );
		// only add it if it's not already there.
		if ( recordingHolder.Labels.indexOf( label ) == -1 ) {
			recordingHolder.Labels.push( label );
			FARDB.Save( recordingHolder );
			FARDB.AddToIndex( id, 'Label_' + label );
			FARDB.AddToIndex( 'Label_' + label, 'Labels' );
		}
	},
	
	RemoveLabel: function( id, label ) {
		var recordingHolder = FARDB.Get( id );
		recordingHolder.Labels.splice( recordingHolder.Labels.indexOf(id), 1);
		FARDB.Save( recordingHolder );
		FARDB.RemoveFromIndex( id, 'Label_' + label );
	},
	
	GetUsage: function() {
		var limit = 5 * 1024 * 1024;
		var length = 0;
		for ( var i = 0; i < localStorage.length; i++ ) {
			var key = localStorage.key(i);
			var value = localStorage.getItem(key);
			length += ( key.length ? value.length : 0 );
			length += ( value.length ? value.length : 0 );
		}
		return {
			Bytes: length,
			Percent: length/limit * 100
		}
	},
	
	GetFromIndex: function( indexName ) {
		var idsJSON = localStorage.getItem( indexName );
		if ( idsJSON === null ) {
			return [];
		}
		var ids = JSON.parse( idsJSON );
		var recordingHolders = [];
		for ( var i in ids ) {
			recordingHolders.push( FARDB.Get( ids[i] ) );
		}
		
		return recordingHolders;
	},
	
	GetAll: function() {
		return FARDB.GetFromIndex( 'AllRecordings' );
	},
	
	GetStarred: function() {
		return FARDB.GetFromIndex( 'Starred' );
	},
	
	GetLabel: function(label) {
		return FARDB.GetFromIndex( 'Label_' + label );
	},
	
	GetLabels: function() {
		var labelJSON = localStorage.getItem( 'Labels' );
		if ( labelJSON === null ) {
			return [];
		}
		var labels = JSON.parse( labelJSON );
		for ( i in labels ) {
			labels[i] = labels[i].replace( /^Label_/, '' );
		}
		return labels;
	},
	
	GetSettings: function() {
		var settings = JSON.parse( localStorage.getItem( "Settings" ) );
		if ( settings === null ) {
			// initialise settings with defaults
			settings = {
				uniqueAttributes: [ 'data-key' ]
			};
			localStorage.setItem( "Settings", JSON.stringify( settings ) );
		}
		return settings;
	},
	
	SetSetting: function( setting, value ) {
		var settings = FARDB.GetSettings();
		settings[ setting ] = value;
		localStorage.setItem( "Settings", JSON.stringify( settings ) );
		return true;
	},
	
	GetSetting: function( setting ) {
		var settings = FARDB.GetSettings();
		return settings[ setting ];
	},
	
	Debug: function() {
		for ( var i = 0; i < localStorage.length; i++ ) {
			var key = localStorage.key(i);
			var value = localStorage.getItem(key);
			console.log( key + '=' + value );
		}
	}
}
