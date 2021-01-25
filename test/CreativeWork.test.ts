import {sdoValidate} from '../';


specify('CreativeWork', () => {
	return sdoValidate({
		"@context":     "http://schema.org/",
		"@type":        "CreativeWork",
		"@id":          "https://chharvey.github.io/schemaorg-jsd/test/creativework.jsonld",
		"keywords":     ["ASCE", "civil engineering", "convention"],
		"thumbnailUrl": "//ektronstaging.asce.org/uploadedImages/_Home_Page/Content_Pieces/asce7.png",
		"isPartOf":     {"@type": "CreativeWork", "description": "a collection maybe"},
		"hasPart": [
			{"@type": "CreativeWork", "description": "an inner creative work that is a part"},
			{"@type": "MediaObject", "description": "a media object (subclass of CreativeWork)"}
		]
	}, null, {
		strict: false,
	});
});
