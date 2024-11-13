public with sharing class ThreadService {
    
    public static Thread__c ensureThread(Id caseId) {
    Thread__c thread = new Thread__c(
            Case__c = caseId,
            Title__c = 'Case Discussion',
            IsArchived__c = false,
            LastCommentDate__c = System.now()
        );
        insert thread;
        return thread;
    }
        
    public Thread__c createThread(String title, Id caseId, Id createdById) {
        Thread__c thread = new Thread__c(
            Title__c = title,
            Case__c = caseId,
            Author__c = createdById,
            IsArchived__c = false
        );
        insert thread;
        return thread;
    }

    public List<Thread__c> getThreadsByCaseId(Id caseId) {
        return [
            SELECT Id, Title__c, LastCommentDate__c, CreatedDate, IsArchived__c
            FROM Thread__c
            WHERE Case__c = :caseId
            ORDER BY LastCommentDate__c DESC
        ];
    }

    public void archiveThread(Id threadId) {
        Thread__c thread = new Thread__c(
            Id = threadId,
            IsArchived__c = true
        );
        update thread;
    }
    
    public static void handleCaseDiscussionArchiveEvent(String caseId) {
        List<Thread__c> threadsToArchive = [
            SELECT Id 
            FROM Thread__c 
            WHERE Case__c = :caseId 
            AND IsArchived__c = false
        ];
        
        for (Thread__c thread : threadsToArchive) {
            thread.IsArchived__c = true;
        }
        update threadsToArchive;
    }
}