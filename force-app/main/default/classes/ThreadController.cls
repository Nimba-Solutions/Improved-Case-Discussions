public with sharing class ThreadController {
    private final ThreadService threadService;
    private final CommentService commentService;
    
    public ThreadController() {
        this.threadService = new ThreadService();
        this.commentService = new CommentService();
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Thread__c> getThreads(Id caseId) {
        try {
            return new ThreadController().threadService.getThreadsByCaseId(caseId);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static Thread__c createThread(String title, Id caseId) {
        try {
            return new ThreadController().threadService.createThread(
                title, 
                caseId, 
                UserInfo.getUserId()
            );
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Comment__c> getComments(Id threadId) {
        try {
            return new ThreadController().commentService.getCommentsByThreadId(threadId);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static Comment__c addComment(String body, Id caseId, Id threadId, Id parentCommentId, Boolean isInternal, List<Id> mentionedUserIds) {
        try {
            Comment__c comment = new ThreadController().commentService.createComment(
                body,
                caseId,
                threadId,
                UserInfo.getUserId(),
                parentCommentId,
                isInternal,
                mentionedUserIds
            );
            
            return [
                SELECT Id, Body__c, IsInternal__c, CreatedDate,
                       Author__c, Author__r.Name, Author__r.SmallPhotoUrl,
                       ParentComment__c, ParentComment__r.Author__r.Name,
                       (SELECT Id, MentionedUser__c, MentionedUser__r.Name 
                        FROM CommentMentions__r)
                FROM Comment__c 
                WHERE Id = :comment.Id
            ];
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void archiveThread(Id threadId) {
        try {
            new ThreadController().threadService.archiveThread(threadId);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}