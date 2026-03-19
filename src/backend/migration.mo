import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Set "mo:core/Set";
import List "mo:core/List";

module {
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

  type OldActor = {
    teams : Map.Map<Nat, Team>;
    entries : Map.Map<Nat, Entry>;
    nextTeamId : Nat;
    nextEntryId : Nat;
    tournamentPhase : TournamentPhase;
    hardcodedTeams : List.List<(Text, Nat)>;
  };

  type NewActor = {
    teams : Map.Map<Nat, Team>;
    entries : Map.Map<Nat, Entry>;
    nextTeamId : Nat;
    nextEntryId : Nat;
    tournamentPhase : TournamentPhase;
    hardcodedTeams : List.List<(Text, Nat)>;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
