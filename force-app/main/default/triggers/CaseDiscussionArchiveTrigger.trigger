trigger CaseDiscussionArchiveTrigger on CaseDiscussionArchive__e (after insert) {
    for (CaseDiscussionArchive__e event : Trigger.new) {
        ThreadService.handleCaseDiscussionArchiveEvent(Id.valueOf(event.CaseId__c));
    }
}