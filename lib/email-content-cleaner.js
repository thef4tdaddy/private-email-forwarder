// lib/email-content-cleaner.js
export class EmailContentCleaner {
  static cleanEmailContent(email) {
    let content = email.body || "";

    // If it's HTML content, extract and clean it
    if (this.isHTML(content)) {
      content = this.cleanHTML(content);
    } else {
      content = this.cleanPlainText(content);
    }

    // Remove tracking links and clean up URLs
    content = this.removeTrackingLinks(content);

    // Limit length for forwarding
    content = this.truncateContent(content, 2000);

    return content;
  }

  static isHTML(content) {
    return (
      /<[^>]+>/.test(content) ||
      content.includes("<!DOCTYPE") ||
      content.includes("<html")
    );
  }

  static cleanHTML(htmlContent) {
    // Remove common HTML tags but keep structure
    let text = htmlContent
      // Remove script and style tags completely
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")

      // Convert common HTML elements to text equivalents
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/div>/gi, "\n")
      .replace(/<div[^>]*>/gi, "")
      .replace(/<h[1-6][^>]*>/gi, "\n**")
      .replace(/<\/h[1-6]>/gi, "**\n")

      // Convert links to readable format
      .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, "$2 ($1)")

      // Remove all other HTML tags
      .replace(/<[^>]+>/g, "")

      // Decode HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

      // Clean up whitespace
      .replace(/\n\s*\n\s*\n/g, "\n\n") // Multiple line breaks to double
      .replace(/[ \t]+/g, " ") // Multiple spaces to single
      .trim();

    return text;
  }

  static cleanPlainText(textContent) {
    return (
      textContent
        // Remove excessive whitespace
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .replace(/[ \t]+/g, " ")
        .trim()
    );
  }

  static removeTrackingLinks(content) {
    // Remove common tracking domains and long tracking URLs
    const trackingPatterns = [
      // AWS tracking links
      /https?:\/\/[a-z0-9]+\.r\.[a-z-]+\.awstrack\.me\/[^\s]*/gi,

      // Other common tracking domains
      /https?:\/\/[a-z0-9]+\.links\.[a-z-]+\.com\/[^\s]*/gi,
      /https?:\/\/click\.[a-z-]+\.com\/[^\s]*/gi,
      /https?:\/\/track\.[a-z-]+\.com\/[^\s]*/gi,

      // Long parameter-heavy URLs (likely tracking)
      /https?:\/\/[^\s]*\?[^\s]{50,}/gi,

      // URLs with tracking parameters
      /(\?|&)(utm_[^&\s]*|fbclid[^&\s]*|gclid[^&\s]*|ref[^&\s]*)/gi,
    ];

    trackingPatterns.forEach((pattern) => {
      content = content.replace(pattern, "[Link Removed]");
    });

    return content;
  }

  static truncateContent(content, maxLength) {
    if (content.length <= maxLength) {
      return content;
    }

    // Try to truncate at a sentence boundary
    const truncated = content.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf(".");
    const lastNewline = truncated.lastIndexOf("\n");

    // Use the best breaking point
    const breakPoint = Math.max(lastSentence, lastNewline);

    if (breakPoint > maxLength * 0.8) {
      return (
        content.substring(0, breakPoint + 1) +
        "\n\n[Content truncated for readability]"
      );
    } else {
      return truncated + "...\n\n[Content truncated for readability]";
    }
  }

  static extractKeyInfo(email) {
    const content = email.body || "";
    const keyInfo = {};

    // Extract price/amount
    const priceMatch = content.match(/\$([0-9,]+\.?[0-9]*)/);
    if (priceMatch) {
      keyInfo.amount = parseFloat(priceMatch[1].replace(",", ""));
    }

    // Extract order/invoice numbers
    const orderMatch = content.match(/order\s*#?\s*([a-z0-9\-]{6,})/i);
    if (orderMatch) {
      keyInfo.orderNumber = orderMatch[1];
    }

    const invoiceMatch = content.match(/invoice\s*#?\s*([a-z0-9\-]{6,})/i);
    if (invoiceMatch) {
      keyInfo.invoiceNumber = invoiceMatch[1];
    }

    // Extract dates
    const dateMatch = content.match(
      /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/
    );
    if (dateMatch) {
      keyInfo.date = dateMatch[1];
    }

    return keyInfo;
  }

  static formatForForwarding(email) {
    const cleanContent = this.cleanEmailContent(email);
    const keyInfo = this.extractKeyInfo(email);

    let formattedContent = cleanContent;

    // Add key info at the top if extracted
    if (Object.keys(keyInfo).length > 0) {
      let infoHeader = "\n📋 KEY DETAILS:\n";

      if (keyInfo.amount) {
        infoHeader += `💰 Amount: $${keyInfo.amount.toFixed(2)}\n`;
      }
      if (keyInfo.orderNumber) {
        infoHeader += `📦 Order: ${keyInfo.orderNumber}\n`;
      }
      if (keyInfo.invoiceNumber) {
        infoHeader += `📄 Invoice: ${keyInfo.invoiceNumber}\n`;
      }
      if (keyInfo.date) {
        infoHeader += `📅 Date: ${keyInfo.date}\n`;
      }

      formattedContent = infoHeader + "\n" + formattedContent;
    }

    return formattedContent;
  }
}
