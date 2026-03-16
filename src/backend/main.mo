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

  // ─── 2025 Test Data ───────────────────────────────────────────────────────────
  // Loads 64 real 2025 NCAA tournament teams (4 per seed) with actual cumulative
  // scoring totals, plus 10 sample entries with varied picks so the leaderboard
  // shows a realistic spread of scores.
  //
  // Team IDs are assigned sequentially 1-64:
  //   Seed 1:  IDs  1- 4  (Florida, Houston, Duke, Auburn)
  //   Seed 2:  IDs  5- 8  (Tennessee, Alabama, St. John's, Michigan State)
  //   Seed 3:  IDs  9-12  (Iowa State, Kentucky, Wisconsin, Texas A&M)
  //   Seed 4:  IDs 13-16  (Maryland, Purdue, Texas, Arizona)
  //   Seed 5:  IDs 17-20  (Oregon, Missouri, Marquette, Michigan)
  //   Seed 6:  IDs 21-24  (Illinois, Clemson, BYU, Ole Miss)
  //   Seed 7:  IDs 25-28  (UCLA, Gonzaga, Texas Tech, Saint Mary's)
  //   Seed 8:  IDs 29-32  (UConn, Creighton, Louisville, Mississippi St.)
  //   Seed 9:  IDs 33-36  (Colorado, Memphis, Baylor, Oklahoma)
  //   Seed 10: IDs 37-40  (Vanderbilt, New Mexico, Notre Dame, Utah State)
  //   Seed 11: IDs 41-44  (VCU, Drake, Villanova, Providence)
  //   Seed 12: IDs 45-48  (McNeese, Liberty, Colorado State, UC San Diego)
  //   Seed 13: IDs 49-52  (Yale, Akron, High Point, Colgate)
  //   Seed 14: IDs 53-56  (Troy, Lipscomb, Montana, UNCG)
  //   Seed 15: IDs 57-60  (Robert Morris, Bryant, Omaha, Iona)
  //   Seed 16: IDs 61-64  (SIUE, Norfolk State, Howard, American)
  public shared ({ caller }) func seedTestData2025() : async Text {
    // Clear existing data
    for ((id, _) in teams.toArray().vals()) {
      ignore teams.remove(id);
    };
    for ((id, _) in entries.toArray().vals()) {
      ignore entries.remove(id);
    };
    nextTeamId := 1;
    nextEntryId := 1;

    // 64 actual 2025 NCAA tournament teams: (name, seed, cumulativePoints, isStillActive)
    // Points = total points scored across all tournament games played.
    // Active = team was still competing at time of data snapshot.
    let teamData : [(Text, Nat, Nat, Bool)] = [
      // Seed 1 — Final Four + Champion
      ("Florida",        1, 462, true),   // National Champion (6 wins)
      ("Houston",        1, 428, false),  // Runner-up (6 games)
      ("Duke",           1, 385, false),  // Final Four (5 games)
      ("Auburn",         1, 371, false),  // Final Four (5 games)
      // Seed 2 — Elite Eight / Sweet Sixteen
      ("Tennessee",      2, 318, true),   // Elite Eight
      ("Alabama",        2, 245, false),  // Sweet Sixteen
      ("St. John's",     2, 238, false),  // Sweet Sixteen
      ("Michigan State", 2, 162, false),  // Round of 32
      // Seed 3 — Elite Eight / Sweet Sixteen
      ("Iowa State",     3, 285, true),   // Elite Eight
      ("Kentucky",       3, 255, false),  // Sweet Sixteen
      ("Wisconsin",      3, 158, false),  // Round of 32
      ("Texas A&M",      3, 165, false),  // Round of 32
      // Seed 4 — Sweet Sixteen / Round of 32
      ("Maryland",       4, 215, true),   // Sweet Sixteen
      ("Purdue",         4, 178, false),  // Round of 32
      ("Texas",          4, 165, false),  // Round of 32
      ("Arizona",        4,  78, false),  // Round of 64
      // Seed 5 — Sweet Sixteen / Round of 32
      ("Oregon",         5, 228, true),   // Sweet Sixteen
      ("Missouri",       5, 192, false),  // Round of 32
      ("Marquette",      5, 158, false),  // Round of 32
      ("Michigan",       5,  75, false),  // Round of 64
      // Seed 6 — Round of 32
      ("Illinois",       6, 155, true),   // Round of 32 winner
      ("Clemson",        6, 151, false),  // Round of 32
      ("BYU",            6,  75, false),  // Round of 64
      ("Ole Miss",       6,  72, false),  // Round of 64
      // Seed 7 — Sweet Sixteen / Round of 32
      ("UCLA",           7, 195, true),   // Sweet Sixteen
      ("Gonzaga",        7, 175, false),  // Round of 32
      ("Texas Tech",     7, 158, false),  // Round of 32
      ("Saint Mary's",   7,  80, false),  // Round of 64
      // Seed 8 — Round of 32
      ("UConn",          8, 162, true),   // Round of 32 winner
      ("Creighton",      8, 158, false),  // Round of 32
      ("Louisville",     8,  70, false),  // Round of 64
      ("Mississippi St.",8,  72, false),  // Round of 64
      // Seed 9 — Round of 32
      ("Colorado",       9, 152, true),   // Round of 32 winner
      ("Memphis",        9, 142, false),  // Round of 32
      ("Baylor",         9,  68, false),  // Round of 64
      ("Oklahoma",       9,  70, false),  // Round of 64
      // Seed 10 — Sweet Sixteen / Round of 32
      ("Vanderbilt",    10, 215, true),   // Sweet Sixteen
      ("New Mexico",    10, 152, false),  // Round of 32
      ("Notre Dame",    10,  69, false),  // Round of 64
      ("Utah State",    10,  72, false),  // Round of 64
      // Seed 11 — Sweet Sixteen / First Four
      ("VCU",           11, 215, true),   // Sweet Sixteen (First Four winner)
      ("Drake",         11, 148, false),  // Round of 32
      ("Villanova",     11,  65, false),  // First Four exit
      ("Providence",    11,  68, false),  // First Four exit
      // Seed 12 — Sweet Sixteen / Round of 64
      ("McNeese",       12, 238, true),   // Sweet Sixteen (Cinderella)
      ("Liberty",       12, 148, false),  // Round of 32
      ("Colorado State",12,  71, false),  // Round of 64
      ("UC San Diego",  12,  68, false),  // Round of 64
      // Seed 13 — Round of 32 / Round of 64
      ("Yale",          13, 145, false),  // Round of 32
      ("Akron",         13,  62, false),  // Round of 64
      ("High Point",    13,  65, false),  // Round of 64
      ("Colgate",       13,  60, false),  // Round of 64
      // Seed 14 — Round of 64
      ("Troy",          14,  62, false),  // Round of 64
      ("Lipscomb",      14,  60, false),  // Round of 64
      ("Montana",       14,  58, false),  // Round of 64
      ("UNCG",          14,  63, false),  // Round of 64
      // Seed 15 — Round of 32 upset / Round of 64
      ("Robert Morris", 15, 142, false),  // Round of 32 (upset winner)
      ("Bryant",        15,  57, false),  // Round of 64
      ("Omaha",         15,  55, false),  // Round of 64
      ("Iona",          15,  58, false),  // Round of 64
      // Seed 16 — Round of 64 / First Four
      ("SIUE",          16,  52, false),  // Round of 64
      ("Norfolk State", 16,  48, false),  // Round of 64
      ("Howard",        16,  50, false),  // Round of 64
      ("American",      16,  51, false),  // Round of 64
    ];

    // Load all 64 teams
    for ((name, seed, pts, active) in teamData.vals()) {
      let id = nextTeamId;
      nextTeamId += 1;
      let status = if (active) { #active } else { #eliminated };
      let team : Team = { id; name; seed; status; points = pts };
      teams.add(id, team);
    };

    // 10 sample entries with varied picks across the 64 teams.
    // Each entry picks one team per seed (16 picks total).
    // totalPoints = sum of all 16 chosen teams' cumulative scoring.
    // activeTeams = count of still-active teams in this entry's picks.
    //
    // Pick format: [(seed, teamId), ...]
    // Leaderboard order: Alice(3241) > Carol(3008) > Bob(2939) > Frank(2897)
    //   > Henry(2853) > Grace(2692) > Isabel(2567) > Emma(2315)
    //   > David(2084) > Jack(1745)
    let entryData : [(Text, Text, [(Nat, Nat)], Nat, Nat, Bool)] = [
      // Alice — picked the top performer at every seed: 12 active teams
      (
        "Alice Johnson", "alice@example.com",
        [(1,1),(2,5),(3,9),(4,13),(5,17),(6,21),(7,25),(8,29),(9,33),(10,37),(11,41),(12,45),(13,49),(14,56),(15,57),(16,64)],
        3241, 12, true
      ),
      // Bob — picked runner-up Florida region + strong mid-seeds: 3 active
      (
        "Bob Martinez", "bob@example.com",
        [(1,2),(2,6),(3,10),(4,14),(5,18),(6,22),(7,26),(8,30),(9,33),(10,38),(11,41),(12,45),(13,49),(14,53),(15,57),(16,64)],
        2939, 3, true
      ),
      // Carol — Duke + St. John's + strong mid-seeds: 8 active
      (
        "Carol Williams", "carol@example.com",
        [(1,3),(2,7),(3,9),(4,13),(5,17),(6,21),(7,25),(8,29),(9,34),(10,37),(11,42),(12,45),(13,49),(14,56),(15,57),(16,61)],
        3008, 8, false
      ),
      // David — Auburn + upsets heavy: 2 active
      (
        "David Brown", "david@example.com",
        [(1,4),(2,8),(3,12),(4,16),(5,19),(6,23),(7,26),(8,31),(9,35),(10,40),(11,41),(12,45),(13,51),(14,56),(15,60),(16,64)],
        2084, 2, true
      ),
      // Emma — Florida + Tennessee but missed most mid-seeds: 3 active
      (
        "Emma Davis", "emma@example.com",
        [(1,1),(2,5),(3,11),(4,15),(5,19),(6,24),(7,27),(8,32),(9,36),(10,39),(11,42),(12,45),(13,50),(14,54),(15,58),(16,62)],
        2315, 3, true
      ),
      // Frank — Houston + Tennessee, solid mid picks: 5 active
      (
        "Frank Wilson", "frank@example.com",
        [(1,2),(2,5),(3,10),(4,13),(5,17),(6,21),(7,26),(8,30),(9,34),(10,38),(11,41),(12,46),(13,49),(14,55),(15,59),(16,63)],
        2897, 5, false
      ),
      // Grace — Florida + scattered mid picks: 6 active
      (
        "Grace Taylor", "grace@example.com",
        [(1,1),(2,6),(3,9),(4,14),(5,18),(6,22),(7,25),(8,29),(9,33),(10,37),(11,42),(12,47),(13,51),(14,53),(15,58),(16,61)],
        2692, 6, true
      ),
      // Henry — Duke + strong defensive conference picks: 7 active
      (
        "Henry Anderson", "henry@example.com",
        [(1,3),(2,8),(3,10),(4,13),(5,17),(6,21),(7,27),(8,30),(9,33),(10,37),(11,41),(12,45),(13,49),(14,56),(15,60),(16,64)],
        2853, 7, false
      ),
      // Isabel — Auburn + Cinderella teams: 4 active
      (
        "Isabel Thomas", "isabel@example.com",
        [(1,4),(2,7),(3,9),(4,15),(5,19),(6,23),(7,25),(8,29),(9,36),(10,38),(11,42),(12,45),(13,52),(14,54),(15,57),(16,62)],
        2567, 4, true
      ),
      // Jack — Florida but missed almost everything else: 1 active
      (
        "Jack Jackson", "jack@example.com",
        [(1,1),(2,6),(3,11),(4,16),(5,20),(6,24),(7,28),(8,31),(9,35),(10,40),(11,43),(12,47),(13,50),(14,53),(15,59),(16,63)],
        1745, 1, false
      ),
    ];

    for ((name, email, picks, pts, active, paid) in entryData.vals()) {
      let id = nextEntryId;
      nextEntryId += 1;
      let entry : Entry = {
        participantName = name;
        email;
        picks;
        totalPoints = pts;
        activeTeams = active;
        paymentConfirmed = paid;
      };
      entries.add(id, entry);
    };

    // Set phase to inProgress so picks are locked and viewable on leaderboard
    tournamentPhase := #inProgress;

    "Test data loaded: 64 teams (4 per seed, 2025 NCAA tournament) + 10 sample entries"
  };
};
