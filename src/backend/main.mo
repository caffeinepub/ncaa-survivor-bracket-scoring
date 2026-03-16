import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import OutCall "http-outcalls/outcall";

actor {
  type Team = {
    id : Nat;
    name : Text;
    seed : Nat;
    status : { #active; #eliminated };
    points : Nat;
  };

  type Entry = {
    participantName : Text;
    email : Text;
    picks : [(Nat, Nat)];
    totalPoints : Nat;
    activeTeams : Nat;
    paymentConfirmed : Bool;
  };

  type TournamentPhase = { #registration; #inProgress; #complete };

  var nextTeamId = 1;
  var nextEntryId = 1;
  let teams = Map.empty<Nat, Team>();
  let entries = Map.empty<Nat, Entry>();

  var tournamentPhase : TournamentPhase = #registration;

  public shared ({ caller }) func addTeam(name : Text, seed : Nat) : async Nat {
    if (seed < 1 or seed > 16) {
      Runtime.trap("Seed must be between 1 and 16");
    };
    let id = nextTeamId;
    nextTeamId += 1;
    let team : Team = { id; name; seed; status = #active; points = 0 };
    teams.add(id, team);
    id;
  };

  public query ({ caller }) func getTeams() : async [Team] {
    teams.values().toArray();
  };

  public shared ({ caller }) func setTournamentPhase(phase : TournamentPhase) : async () {
    tournamentPhase := phase;
  };

  public shared ({ caller }) func registerEntry(participantName : Text, email : Text, picks : [(Nat, Nat)]) : async Nat {
    if (tournamentPhase != #registration) {
      Runtime.trap("Registration is closed");
    };
    if (picks.size() != 16) {
      Runtime.trap("Must have exactly 16 picks");
    };
    let seeds = Set.empty<Nat>();
    for ((seed, _) in picks.values()) {
      if (seeds.contains(seed)) {
        Runtime.trap("Duplicate seed detected");
      };
      seeds.add(seed);
    };
    for ((_, teamId) in picks.values()) {
      if (not teams.containsKey(teamId)) {
        Runtime.trap("Invalid team ID in picks");
      };
    };
    let id = nextEntryId;
    nextEntryId += 1;
    let entry : Entry = {
      participantName; email; picks;
      totalPoints = 0; activeTeams = 16; paymentConfirmed = false;
    };
    entries.add(id, entry);
    id;
  };

  public shared ({ caller }) func confirmPayment(entryId : Nat) : async () {
    switch (entries.get(entryId)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) {
        entries.add(entryId, { entry with paymentConfirmed = true });
      };
    };
  };

  public shared ({ caller }) func unconfirmPayment(entryId : Nat) : async () {
    switch (entries.get(entryId)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) {
        entries.add(entryId, { entry with paymentConfirmed = false });
      };
    };
  };

  public shared ({ caller }) func deleteEntry(entryId : Nat) : async () {
    switch (entries.get(entryId)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?_) { entries.remove(entryId) };
    };
  };

  module Entry {
    public func compareByTotalPointsReversed(left : (Nat, Entry), right : (Nat, Entry)) : Order.Order {
      Nat.compare(right.1.totalPoints, left.1.totalPoints);
    };
  };

  public query ({ caller }) func getLeaderboard() : async [(Nat, Entry)] {
    entries.toArray().sort(Entry.compareByTotalPointsReversed);
  };

  public query ({ caller }) func getEntry(entryId : Nat) : async Entry {
    switch (entries.get(entryId)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) { entry };
    };
  };

  public shared ({ caller }) func fetchAndSyncScores() : async Text {
    await OutCall.httpGetRequest("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/scoreboard.json", [], transform);
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // 2026 NCAA Men's Tournament — all 68 teams from ncaa.com
  // Seeds 11 and 16 have 6 teams each (2 First Four play-in matchups per seed).
  // Source: https://www.ncaa.com/brackets/basketball-men/d1/2026
  let hardcodedTeams = List.fromArray<(Text, Nat)>([
    ("Duke", 1),          ("Arizona", 1),        ("Florida", 1),       ("Michigan", 1),
    ("UConn", 2),         ("Purdue", 2),          ("Houston", 2),       ("Iowa St.", 2),
    ("Michigan St.", 3),  ("Gonzaga", 3),         ("Illinois", 3),      ("Virginia", 3),
    ("Kansas", 4),        ("Arkansas", 4),        ("Nebraska", 4),      ("Alabama", 4),
    ("St. John's", 5),    ("Wisconsin", 5),       ("Vanderbilt", 5),    ("Texas Tech", 5),
    ("Louisville", 6),    ("BYU", 6),             ("North Carolina", 6),("Tennessee", 6),
    ("UCLA", 7),          ("Miami (FL)", 7),      ("Saint Mary's", 7),  ("Kentucky", 7),
    ("Ohio St.", 8),      ("Villanova", 8),       ("Clemson", 8),       ("Georgia", 8),
    ("TCU", 9),           ("Utah St.", 9),        ("Iowa", 9),          ("Saint Louis", 9),
    ("UCF", 10),          ("Missouri", 10),       ("Texas A&M", 10),    ("Santa Clara", 10),
    // Seed 11: South Florida (E direct), VCU (S direct), + First Four: Texas/NC State (MW), Miami (Ohio)/SMU (S)
    ("South Florida", 11),("VCU", 11),            ("Texas", 11),        ("NC State", 11),
    ("Miami (Ohio)", 11), ("SMU", 11),
    ("Northern Iowa", 12),("High Point", 12),     ("McNeese", 12),      ("Akron", 12),
    ("Cal Baptist", 13),  ("Hawaii", 13),         ("Troy", 13),         ("Hofstra", 13),
    ("North Dakota St.", 14),("Kennesaw St.", 14),("Penn", 14),          ("Wright St.", 14),
    ("Furman", 15),       ("Queens (N.C.)", 15),  ("Idaho", 15),        ("Tennessee St.", 15),
    // Seed 16: Siena (E direct), Long Island (W direct), + First Four: UMBC/Howard (MW), Prairie View A&M/Lehigh (W)
    ("Siena", 16),        ("Long Island", 16),    ("UMBC", 16),         ("Howard", 16),
    ("Prairie View A&M", 16),("Lehigh", 16),
  ]);

  public shared ({ caller }) func seedTeamsFromBracket() : async Nat {
    // Clear all existing teams first so only official 2026 teams remain
    teams.clear();
    nextTeamId := 1;
    var loadedTeams = 0;
    for (teamEntry in hardcodedTeams.values()) {
      let (name, seed) = teamEntry;
      let id = nextTeamId;
      nextTeamId += 1;
      teams.add(id, { id; name; seed; status = #active; points = 0 });
      loadedTeams += 1;
    };
    loadedTeams;
  };
};
