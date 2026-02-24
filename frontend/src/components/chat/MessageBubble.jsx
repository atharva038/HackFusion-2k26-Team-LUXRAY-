import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Search, Loader2 } from 'lucide-react';
import OrderCard from './OrderCard';

const ToolExecutionBadge = ({ tool }) => {
    const icons = {
        search: <Search className="w-3.5 h-3.5" />,
        validate: <ShieldCheck className="w-3.5 h-3.5" />,
        success: <CheckCircle2 className="w-3.5 h-3.5" />,
        loading: <Loader2 className="w-3.5 h-3.5 animate-spin" />
    };

    return (
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border
      ${tool.status === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' :
                'bg-primary/5 text-primary border-primary/10'}`}>
            {icons[tool.icon] || icons.success}
            {tool.text}
        </div>
    );
};

const MessageBubble = ({ message }) => {
    const isAi = message.role === 'ai';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex w-full ${isAi ? 'justify-start' : 'justify-end'}`}
        >
            <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%]`}>

                {/* Tool Executions (Only for AI) */}
                {isAi && message.tools && message.tools.length > 0 && (
                    <div className="flex flex-col gap-1.5 ml-2">
                        {message.tools.map((tool, idx) => (
                            <ToolExecutionBadge key={idx} tool={tool} />
                        ))}
                    </div>
                )}

                {/* The Message Bubble */}
                <div className={`
          relative px-5 py-4 text-[15px] leading-relaxed shadow-sm
          ${isAi
                        ? 'rounded-3xl rounded-tl-sm bg-card text-text border border-black/5 dark:border-white/5'
                        : 'rounded-3xl rounded-tr-sm bg-primary text-white shadow-soft font-medium'
                    }
        `}>
                    {message.text}
                </div>

                {/* Optional Order Confirmation Extension */}
                {isAi && message.orderCard && (
                    <div className="mt-2 text-text">
                        <OrderCard details={message.orderCard} />
                    </div>
                )}

            </div>
        </motion.div>
    );
};

export default MessageBubble;
