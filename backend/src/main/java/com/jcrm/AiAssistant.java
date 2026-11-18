package com.jcrm;

import static com.jcrm.Domain.*;

interface AiAssistant {
    AiResult generate(Snapshot context,String action,String dealId,String question);
}
