import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  // Old types (without email and paymentConfirmed)
  type Team = {
    id : Nat;
    name : Text;
    seed : Nat;
    status : { #active; #eliminated };
    points : Nat;
  };

  type Entry = {
    participantName : Text;
    picks : [(Nat, Nat)];
    totalPoints : Nat;
    activeTeams : Nat;
  };

  type OldActor = {
    nextTeamId : Nat;
    nextEntryId : Nat;
    teams : Map.Map<Nat, Team>;
    entries : Map.Map<Nat, Entry>;
    tournamentPhase : { #registration; #inProgress; #complete };
  };

  // New types (with email and paymentConfirmed)
  type NewEntry = {
    participantName : Text;
    email : Text;
    picks : [(Nat, Nat)];
    totalPoints : Nat;
    activeTeams : Nat;
    paymentConfirmed : Bool;
  };

  type NewActor = {
    nextTeamId : Nat;
    nextEntryId : Nat;
    teams : Map.Map<Nat, Team>;
    entries : Map.Map<Nat, NewEntry>;
    tournamentPhase : { #registration; #inProgress; #complete };
  };

  public func run(old : OldActor) : NewActor {
    let newEntries = old.entries.map<Nat, Entry, NewEntry>(
      func(_id, oldEntry) {
        {
          oldEntry with
          email = "";
          paymentConfirmed = false;
        };
      }
    );
    {
      old with
      entries = newEntries;
    };
  };
};
