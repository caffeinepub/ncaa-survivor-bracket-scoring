import Array "mo:core/Array";
import Iter "mo:core/Iter";
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

  // Team administration
  public shared ({ caller }) func addTeam(name : Text, seed : Nat) : async Nat {
    if (seed < 1 or seed > 16) {
      Runtime.trap("Seed must be between 1 and 16");
    };

    let id = nextTeamId;
    nextTeamId += 1;

    let team : Team = {
      id;
      name;
      seed;
      status = #active;
      points = 0;
    };

    teams.add(id, team);
    id;
  };

  // Get all teams
  public query ({ caller }) func getTeams() : async [Team] {
    teams.values().toArray();
  };

  // Tournament phase management
  public shared ({ caller }) func setTournamentPhase(phase : TournamentPhase) : async () {
    tournamentPhase := phase;
  };

  // User entry management
  public shared ({ caller }) func registerEntry(participantName : Text, email : Text, picks : [(Nat, Nat)]) : async Nat {
    if (tournamentPhase != #registration) {
      Runtime.trap("Registration is closed");
    };

    if (picks.size() != 16) {
      Runtime.trap("Must have exactly 16 picks");
    };

    // Check for duplicate seeds
    let seeds = Set.empty<Nat>();
    for ((seed, _) in picks.values()) {
      if (seeds.contains(seed)) {
        Runtime.trap("Duplicate seed detected");
      };
      seeds.add(seed);
    };

    // Validate teams
    for ((_, teamId) in picks.values()) {
      if (not teams.containsKey(teamId)) {
        Runtime.trap("Invalid team ID in picks");
      };
    };

    let id = nextEntryId;
    nextEntryId += 1;

    let entry : Entry = {
      participantName;
      email;
      picks;
      totalPoints = 0;
      activeTeams = 16;
      paymentConfirmed = false;
    };

    entries.add(id, entry);
    id;
  };

  // Payment confirmation (admin functions)
  public shared ({ caller }) func confirmPayment(entryId : Nat) : async () {
    switch (entries.get(entryId)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) {
        let updatedEntry = { entry with paymentConfirmed = true };
        entries.add(entryId, updatedEntry);
      };
    };
  };

  public shared ({ caller }) func unconfirmPayment(entryId : Nat) : async () {
    switch (entries.get(entryId)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) {
        let updatedEntry = { entry with paymentConfirmed = false };
        entries.add(entryId, updatedEntry);
      };
    };
  };

  // Delete an entry (admin function)
  public shared ({ caller }) func deleteEntry(entryId : Nat) : async () {
    switch (entries.get(entryId)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?_) {
        ignore entries.remove(entryId);
      };
    };
  };

  // Leaderboard retrieval
  module Entry {
    public func compareByTotalPointsReversed(left : (Nat, Entry), right : (Nat, Entry)) : Order.Order {
      Nat.compare(right.1.totalPoints, left.1.totalPoints);
    };
  };

  public query ({ caller }) func getLeaderboard() : async [(Nat, Entry)] {
    entries.toArray().sort(Entry.compareByTotalPointsReversed);
  };

  // Entry retrieval
  public query ({ caller }) func getEntry(entryId : Nat) : async Entry {
    switch (entries.get(entryId)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) { entry };
    };
  };

  // NCAA Teams and Scores Fetching
  public shared ({ caller }) func fetchAndSyncScores() : async Text {
    await OutCall.httpGetRequest("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/scoreboard.json", [], transform);
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // 2026 NCAA Men's Tournament bracket teams
  let hardcodedTeams = List.fromArray<(Text, Nat)>([
    // Seed 1
    ("Duke", 1),
    ("Arizona", 1),
    ("Florida", 1),
    ("Michigan", 1),
    // Seed 2
    ("UConn", 2),
    ("Purdue", 2),
    ("Houston", 2),
    ("Iowa St.", 2),
    // Seed 3
    ("Michigan St.", 3),
    ("Gonzaga", 3),
    ("Illinois", 3),
    ("Virginia", 3),
    // Seed 4
    ("Kansas", 4),
    ("Arkansas", 4),
    ("Nebraska", 4),
    ("Alabama", 4),
    // Seed 5
    ("St. John's", 5),
    ("Wisconsin", 5),
    ("Vanderbilt", 5),
    ("Texas Tech", 5),
    // Seed 6
    ("Louisville", 6),
    ("BYU", 6),
    ("North Carolina", 6),
    ("Tennessee", 6),
    // Seed 7
    ("UCLA", 7),
    ("Miami (FL)", 7),
    ("Saint Mary's", 7),
    ("Kentucky", 7),
    // Seed 8
    ("Ohio St.", 8),
    ("Villanova", 8),
    ("Clemson", 8),
    ("Georgia", 8),
    // Seed 9
    ("TCU", 9),
    ("Utah St.", 9),
    ("Iowa", 9),
    ("Saint Louis", 9),
    // Seed 10
    ("UCF", 10),
    ("Missouri", 10),
    ("Texas A&M", 10),
    ("Santa Clara", 10),
    // Seed 11 (includes First Four teams)
    ("South Florida", 11),
    ("VCU", 11),
    ("Texas", 11),
    ("NC State", 11),
    ("Miami (OH)", 11),
    ("SMU", 11),
    // Seed 12
    ("Northern Iowa", 12),
    ("High Point", 12),
    ("McNeese", 12),
    ("Akron", 12),
    // Seed 13
    ("Cal Baptist", 13),
    ("Hawaii", 13),
    ("Troy", 13),
    ("Hofstra", 13),
    // Seed 14
    ("North Dakota St.", 14),
    ("Kennesaw St.", 14),
    ("Penn", 14),
    ("Wright St.", 14),
    // Seed 15
    ("Furman", 15),
    ("Queens (NC)", 15),
    ("Idaho", 15),
    ("Tennessee St.", 15),
    // Seed 16 (includes First Four teams)
    ("Siena", 16),
    ("Long Island", 16),
    ("UMBC", 16),
    ("Howard", 16),
    ("Prairie View A&M", 16),
    ("Lehigh", 16),
  ]);

  public shared ({ caller }) func seedTeamsFromBracket() : async Nat {
    var loadedTeams = 0;

    for (team in hardcodedTeams.values()) {
      let (name, seed) = team;
      let existing = teams.values().find(
        func(team) {
          team.name == name and team.seed == seed
        }
      );
      if (existing == null) {
        ignore await addTeam(name, seed);
        loadedTeams += 1;
      };
    };

    loadedTeams;
  };
};
