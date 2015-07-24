QUnit.test("Framework Exists", function( assert ) {
  assert.ok(MyWebRTC, "Passed!" );
});

QUnit.test("Version Accessible", function( assert ) {
  assert.ok(MyWebRTC.version, "Passed!" );
});

QUnit.test("PeerConnection shim available", function( assert ) {
  assert.ok(PeerConnection, "Passed!" );
});

QUnit.test("IceCandidate shim available", function( assert ) {
  assert.ok(IceCandidate, "Passed!" );
});

QUnit.test("SessionDescription shim available", function( assert ) {
  assert.ok(SessionDescription, "Passed!" );
});

QUnit.test("navigator.getUserMedia shim available", function( assert ) {
  assert.ok(navigator.getUserMedia, "Passed!" );
});

QUnit.test("Toggle fullscreen accessible", function( assert ) {
  assert.ok(MyWebRTC.toggleFullscreen, "Passed!" );
});



