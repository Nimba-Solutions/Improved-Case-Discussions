public with sharing class CommentService {
    private static final String NOTIFICATION_TYPE = 'CommentMention';
    
    public Comment__c createComment(String body, Id caseId, Id threadId, Id authorId, Id parentCommentId, Boolean isInternal, List<Id> mentionedUserIds) {
        if (String.isBlank(threadId)) {
            Thread__c thread = ThreadService.ensureThread(caseId);
            threadId = thread.Id;
        }
        Comment__c comment = new Comment__c(
            Body__c = body,
            Thread__c = threadId,
            Author__c = authorId,
            ParentComment__c = parentCommentId,
            IsInternal__c = isInternal
        );
        insert comment;
        
        updateThreadLastCommentDate(threadId);
        
        if (mentionedUserIds != null && !mentionedUserIds.isEmpty()) {
            List<CommentMention__c> mentions = new List<CommentMention__c>();
            for (Id userId : mentionedUserIds) {
                mentions.add(new CommentMention__c(
                    Comment__c = comment.Id,
                    MentionedUser__c = userId
                ));
            }
            insert mentions;
        }
        
        processMentions(comment, mentionedUserIds);
        
        return [
            SELECT Id, Body__c, IsInternal__c, CreatedDate,
                   Author__c, Author__r.Name, Author__r.SmallPhotoUrl,
                   ParentComment__c, ParentComment__r.Author__r.Name,
                   (SELECT Id, MentionedUser__c, MentionedUser__r.Name 
                    FROM CommentMentions__r)
            FROM Comment__c 
            WHERE Id = :comment.Id
        ];
    }
    
    public List<Comment__c> getCommentsByThreadId(Id threadId) {
        return [
            SELECT Id, Body__c, 
            Author__c, 
            Author__r.Name,
            Author__r.SmallPhotoUrl,
            ParentComment__c, 
            ParentComment__r.Author__r.Name,
            ParentComment__r.Author__r.SmallPhotoUrl,
            IsInternal__c,
            CreatedDate,
            (SELECT Id, MentionedUser__c, MentionedUser__r.Name 
             FROM CommentMentions__r)
            FROM Comment__c
            WHERE Thread__c = :threadId
            ORDER BY CreatedDate ASC
        ];
    }
    
    private void updateThreadLastCommentDate(Id threadId) {
        Thread__c thread = new Thread__c(
            Id = threadId,
            LastCommentDate__c = System.now()
        );
        update thread;
    }
    
    private void processMentions(Comment__c comment, List<String> mentionedUserIds) {
        if (mentionedUserIds == null || mentionedUserIds.isEmpty()) return;
        
        Set<String> recipientIds = new Set<String>(mentionedUserIds); // Directly use mentionedUserIds as Set<String>
        
        // Get Case context
        Thread__c thread = [
            SELECT Case__c FROM Thread__c WHERE Id = :comment.Thread__c LIMIT 1
        ];
        
        if (thread.Case__c != null && !recipientIds.isEmpty()) {
            Messaging.CustomNotification notification = new Messaging.CustomNotification();
            notification.setTitle(UserInfo.getName() + ' mentioned you in a case comment');
            notification.setBody('Click to view details');
            notification.setNotificationTypeId(getNotificationTypeId());
            notification.setTargetId(thread.Case__c);
            
            try {
                notification.send(recipientIds);
            } catch (Exception e) {
                System.debug('Error sending notification: ' + e.getMessage());
            }
        }
    }



    private Id getNotificationTypeId() {
        try {
            return [
                SELECT Id 
                FROM CustomNotificationType 
                WHERE DeveloperName = :NOTIFICATION_TYPE 
                LIMIT 1
            ].Id;
        } catch (Exception e) {
            System.debug('Error retrieving notification type ID: ' + e.getMessage());
            return null;
        }
    }
    
    private Set<String> extractMentions(String body) {
        Set<String> mentions = new Set<String>();
        Pattern mentionPattern = Pattern.compile('@([\\w]+)');
        Matcher matcher = mentionPattern.matcher(body);
        
        while (matcher.find()) {
            mentions.add(matcher.group(1));
        }
        return mentions;
    }
    
    @AuraEnabled(cacheable=true)
    public static String getSmallPhotoUrl(String userId) {
        return [SELECT SmallPhotoUrl FROM User WHERE Id = :userId LIMIT 1].SmallPhotoUrl;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<User> searchUsers(String searchTerm) {
        if (String.isBlank(searchTerm)) return new List<User>();
        
        String searchKey = '%' + String.escapeSingleQuotes(searchTerm) + '%';
        return [
            SELECT Id, Name, SmallPhotoUrl 
            FROM User 
            WHERE Name LIKE :searchKey 
            AND IsActive = true 
            ORDER BY Name 
            LIMIT 5
        ];
    }
}